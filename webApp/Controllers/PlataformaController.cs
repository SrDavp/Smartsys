using SmartSys.Models;
using System;
using System.Collections.Generic;
using System.EnterpriseServices.Internal;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;


namespace SmartSys.Controllers
{
    public class PlataformaController : Controller
    {
        SmartSysDbContext db = new SmartSysDbContext();

        [HttpGet]
        public ActionResult CrearPlataforma()
        {
            if (Session["UsuarioID"] == null)
                return RedirectToAction("Login", "Account");

            return View();
        }

        [HttpPost]
        public ActionResult CrearPlataforma(Plataforma p, HttpPostedFileBase IconoFile, HttpPostedFileBase FondoFile)
        {
            if (Session["UsuarioID"] == null)
                return RedirectToAction("Login", "Account");
            //Validar Capacidad
            if (p.capacidadMiembros_plataforma < 10 || p.capacidadMiembros_plataforma > 1000)
            {
                ViewBag.Error = "La cantidad de miembros es de 10 a 1000";
                return View(p);
            }

            if (ModelState.IsValid)
            {
                // Código aleatorio para plataformas privadas
                p.codigoPlataforma = Guid.NewGuid().ToString("N").Substring(0, 10);
                p.fechaCreacion = DateTime.Now;

                if (IconoFile != null && IconoFile.ContentLength > 0)
                {
                    using (var br = new BinaryReader(IconoFile.InputStream))
                    {
                        p.iconoPlataforma = br.ReadBytes(IconoFile.ContentLength);
                    }
                }

                if (FondoFile != null && FondoFile.ContentLength > 0)
                {
                    using (var br = new BinaryReader(FondoFile.InputStream))
                    {
                        p.fondoPlataforma = br.ReadBytes(FondoFile.ContentLength);
                    }
                }

                db.Plataforma.Add(p);
                db.SaveChanges();

                // Asociar usuario creador como Admin en la plataforma
                long idUsuario = Convert.ToInt64(Session["UsuarioID"]);
                var rel = new usuario_plataforma
                {
                    idUsuario4 = idUsuario,
                    idPlataforma1 = p.idPlataforma,
                    rolUsuarioPlataforma = "Admin"
                };
                db.usuario_plataforma.Add(rel);
                db.SaveChanges();

                return RedirectToAction("MisPlataformas");
            }

            return View(p);
        }

        public ActionResult MisPlataformas()
        {
            if (Session["UsuarioID"] == null)
                return RedirectToAction("Login", "Account");

            long idUsuario = Convert.ToInt64(Session["UsuarioID"]);

            var plataformas = (from rel in db.usuario_plataforma
                               join pla in db.Plataforma on rel.idPlataforma1 equals pla.idPlataforma
                               where rel.idUsuario4 == idUsuario
                               select pla).ToList();

            // IDs de plataformas donde es admin
            var plataformasAdmin = db.usuario_plataforma
                .Where(x => x.idUsuario4 == idUsuario && x.rolUsuarioPlataforma == "Admin")
                .Select(x => x.idPlataforma1)
                .ToList();

            ViewBag.PlataformasAdmin = plataformasAdmin;

            return View(plataformas);
        }


        //Detalles de la plataforma
        public ActionResult Detalles(long id)
        {
            if (Session["UsuarioID"] == null)
                return RedirectToAction("Login", "Account");

            var plataforma = db.Plataforma.Find(id);
            if (plataforma == null)
                return HttpNotFound();

            return View(plataforma);
        }
        //Metodo Para Explorar o Buscar Plataformas
        [HttpGet]
        public ActionResult Explorar(string busqueda = "")
        {
            if (Session["UsuarioID"] == null)
                return RedirectToAction("Login", "Account");

            var privadosPermitidos = new[] { "Público", "Privado", "Public", "Private" };

            var plataformas = db.Plataforma
                .Where(p => privadosPermitidos.Contains(p.privacidadPlataforma) &&
                            (p.nombrePlataforma.Contains(busqueda) ||
                             p.descripcionPlataforma.Contains(busqueda)))
                .ToList();

            ViewBag.Busqueda = busqueda;
            return View(plataformas);
        }

        //Explorar Mostrar Plataformas
        public ActionResult Explorar()
        {
            if (Session["UsuarioID"] == null)
                return RedirectToAction("Login", "Account");

            var plataformas = db.Plataforma
                .Where(p => p.estadoPlataforma == "Activo")
                .ToList();

            return View(plataformas);
        }

        //Metodo para Unirser Publico y Privado
        //Publico
        public ActionResult UnirsePublico(long id)
        {
            if (Session["UsuarioID"] == null)
                return RedirectToAction("Login", "Account");

            long idUsuario = Convert.ToInt64(Session["UsuarioID"]);

            var plataforma = db.Plataforma.Find(id);
            if (plataforma == null)
                return HttpNotFound();

            // Contar miembros actuales
            int miembrosActuales = db.usuario_plataforma.Count(x => x.idPlataforma1 == id);

            // Validar límite
            if (miembrosActuales >= plataforma.capacidadMiembros_plataforma)
            {
                TempData["Error"] = "Plataforma con Miembros Completos.";
                return RedirectToAction("Explorar", "Plataforma", new { id = id });
            }

            // Verifica si ya está unido
            var existe = db.usuario_plataforma.Any(x => x.idUsuario4 == idUsuario && x.idPlataforma1 == id);
            if (!existe)
            {
                var nuevaRelacion = new usuario_plataforma
                {
                    idUsuario4 = idUsuario,
                    idPlataforma1 = id,
                    rolUsuarioPlataforma = "Miembro"
                };
                db.usuario_plataforma.Add(nuevaRelacion);
                db.SaveChanges();
            }

            return RedirectToAction("MisPlataformas");
        }
        //Unirse Privado
        [HttpGet]
        public ActionResult UnirsePrivado(long id)
        {
            ViewBag.PlataformaId = id;
            return View();
        }

        [HttpPost]
        public ActionResult UnirsePrivado(long id, string codigo)
        {
            if (Session["UsuarioID"] == null)
                return RedirectToAction("Login", "Account");

            var plataforma = db.Plataforma.Find(id);
            if (plataforma == null)
                return HttpNotFound();

            if (plataforma.codigoPlataforma == codigo)
            {
                long idUsuario = Convert.ToInt64(Session["UsuarioID"]);

                // Contar miembros actuales
                int miembrosActuales = db.usuario_plataforma.Count(x => x.idPlataforma1 == id);

                // Validar límite
                if (miembrosActuales >= plataforma.capacidadMiembros_plataforma)
                {
                    ViewBag.Error = "Plataforma con Miembros Completos.";
                    ViewBag.PlataformaId = id;
                    return View();
                }

                var existe = db.usuario_plataforma.Any(x => x.idUsuario4 == idUsuario && x.idPlataforma1 == id);
                if (!existe)
                {
                    db.usuario_plataforma.Add(new usuario_plataforma
                    {
                        idUsuario4 = idUsuario,
                        idPlataforma1 = id,
                        rolUsuarioPlataforma = "Miembro"
                    });
                    db.SaveChanges();
                }

                return RedirectToAction("MisPlataformas");
            }

            ViewBag.Error = "Código incorrecto.";
            ViewBag.PlataformaId = id;
            return View();
        }
        //Verficar si es Admin para Administrar sus plataformas
        private bool EsAdmin(long idPlataforma)
        {
            long idUsuario = Convert.ToInt64(Session["UsuarioID"]);
            return db.usuario_plataforma.Any(u => u.idUsuario4 == idUsuario && u.idPlataforma1 == idPlataforma && u.rolUsuarioPlataforma == "Admin");
        }
        //Rutas de Control
        [HttpGet]
        public ActionResult PanelAdmin(long id)
        {
            if (Session["UsuarioID"] == null)
                return RedirectToAction("Login", "Account");

            long usuarioId = Convert.ToInt64(Session["UsuarioID"]);

            // Verificar si es Admin de esa plataforma
            var relacion = db.usuario_plataforma
                .FirstOrDefault(x => x.idUsuario4 == usuarioId && x.idPlataforma1 == id && x.rolUsuarioPlataforma == "Admin");

            if (relacion == null)
                return RedirectToAction("Explorar");

            var plataforma = db.Plataforma.Find(id);
            return View(plataforma);
        }
        //Editar Plataforma
        [HttpGet]
        public ActionResult EditarPlataforma(long id)
        {
            var plataforma = db.Plataforma.Find(id);
            return View(plataforma);
        }

        [HttpPost]
        public ActionResult EditarPlataforma(Plataforma p)
        {
            var plataforma = db.Plataforma.Find(p.idPlataforma);

            if (plataforma != null)
            {
                plataforma.nombrePlataforma = p.nombrePlataforma;
                plataforma.descripcionPlataforma = p.descripcionPlataforma;
                plataforma.capacidadMiembros_plataforma = p.capacidadMiembros_plataforma;
                plataforma.privacidadPlataforma = p.privacidadPlataforma;
                plataforma.codigoPlataforma = p.codigoPlataforma;
                plataforma.estadoPlataforma = p.estadoPlataforma;

                db.SaveChanges();
                return RedirectToAction("PanelAdmin", new { id = plataforma.idPlataforma });
            }

            return View(p);
        }
        //Ver Miembros de la Plataforma
        [HttpGet]
        public ActionResult VerMiembros(long id)
        {
            if (Session["UsuarioID"] == null)
                return RedirectToAction("Login", "Account");

            long usuarioId = Convert.ToInt64(Session["UsuarioID"]);

            // Trae la lista de miembros
            var miembros = db.usuario_plataforma
    .Where(up => up.idPlataforma1 == id)
    .Join(db.Usuario,
        rel => rel.idUsuario4,
        usu => usu.IdUsuario,
        (rel, usu) => new MiembroViewModel
        {
            Usuario = usu,
            Relacion = rel
        })
    .ToList();


            ViewBag.PlataformaId = id;
            return View(miembros);
        }

        //Gestionar Miembro de la Plataforma
        [HttpGet]
        public ActionResult GestionMiembros(long id)
        {
            if (Session["UsuarioID"] == null)
                return RedirectToAction("Login", "Account");

            long usuarioId = Convert.ToInt64(Session["UsuarioID"]);

            // Verifica que el usuario sea admin de la plataforma
            var esAdmin = db.usuario_plataforma.Any(x =>
                x.idUsuario4 == usuarioId &&
                x.idPlataforma1 == id &&
                x.rolUsuarioPlataforma == "Admin");

            // Trae la lista de miembros
            var miembros = db.usuario_plataforma
    .Where(up => up.idPlataforma1 == id)
    .Join(db.Usuario,
        rel => rel.idUsuario4,
        usu => usu.IdUsuario,
        (rel, usu) => new MiembroViewModel
        {
            Usuario = usu,
            Relacion = rel
        })
    .ToList();


            ViewBag.PlataformaId = id;
            return View(miembros);
        }
        //Metodo para cambiar de Rol o Expulsar al Miembro de la plataforma
        public ActionResult CambiarRol(long idUsuario, long idPlataforma)
        {
            var rel = db.usuario_plataforma.FirstOrDefault(x =>
                x.idUsuario4 == idUsuario && x.idPlataforma1 == idPlataforma);

            if (rel != null)
            {
                rel.rolUsuarioPlataforma = "Admin";
                db.SaveChanges();
            }

            return RedirectToAction("GestionMiembros", new { id = idPlataforma });
        }

        public ActionResult Expulsar(long idUsuario, long idPlataforma)
        {
            var rel = db.usuario_plataforma.FirstOrDefault(x =>
                x.idUsuario4 == idUsuario && x.idPlataforma1 == idPlataforma);

            if (rel != null)
            {
                db.usuario_plataforma.Remove(rel);
                db.SaveChanges();
            }

            return RedirectToAction("GestionMiembros", new { id = idPlataforma });
        }

        //Publicaciones Plataformas
        public ActionResult Publicaciones(long id)
        {
            if (Session["UsuarioID"] == null)
                return RedirectToAction("Login", "Account");

            long usuarioId = Convert.ToInt64(Session["UsuarioID"]);

            // ✅ Validar que el usuario pertenece a la plataforma
            var pertenece = db.usuario_plataforma
                              .Any(up => up.idUsuario4 == usuarioId && up.idPlataforma1 == id);

            if (!pertenece)
            {
                // Redirige a MisPlataformas o Explorar si no pertenece
                TempData["Error"] = "No tienes acceso a esta plataforma.";
                return RedirectToAction("MisPlataformas");
            }

            // Traer publicaciones de la plataforma junto con el rol del usuario que las publicó
            var publicacionesConRol = (from pub in db.Publicaciones
                                       join rel in db.plataforma_publicacion
                                           on pub.idPublicacion equals rel.idPublicacion2
                                       join up in db.usuario_publicaciones
                                           on pub.idPublicacion equals up.idPublicacion1
                                       join usu in db.Usuario
                                           on up.idUsuario1 equals usu.IdUsuario
                                       join usp in db.usuario_plataforma
                                           on new { usu.IdUsuario, rel.idPlataforma2 } equals new { IdUsuario = usp.idUsuario4, idPlataforma2 = usp.idPlataforma1 }
                                       where rel.idPlataforma2 == id && pub.estado == "Activo"
                                       select new
                                       {
                                           Publicacion = pub,
                                           Autor = usu.Nombre + " " + usu.Apellido,
                                           RolUsuario = usp.rolUsuarioPlataforma
                                       }).ToList();

            // Separar publicaciones y diccionario de autores si lo necesitas en la vista
            var publicaciones = publicacionesConRol.Select(x => x.Publicacion).ToList();
            var autores = publicacionesConRol
                          .GroupBy(x => x.Publicacion.idPublicacion)
                          .ToDictionary(g => g.Key, g => g.Select(x => x.Autor).FirstOrDefault());
            var roles = publicacionesConRol
                          .GroupBy(x => x.Publicacion.idPublicacion)
                          .ToDictionary(g => g.Key, g => g.Select(x => x.RolUsuario).FirstOrDefault());

            var rolUsuarioActual = db.usuario_plataforma
                                     .Where(up => up.idUsuario4 == usuarioId && up.idPlataforma1 == id)
                                     .Select(up => up.rolUsuarioPlataforma)
                                     .FirstOrDefault();

            ViewBag.RolUsuarioActual = rolUsuarioActual;
            ViewBag.PlataformaId = id;
            ViewBag.Autores = autores;
            ViewBag.Roles = roles;

            return View(publicaciones);
        }





        // Listado de publicaciones
        public ActionResult Contenido(long id)
        {
            var publicaciones = (from pub in db.Publicaciones
                                 join rel in db.plataforma_publicacion on pub.idPublicacion equals rel.idPublicacion2
                                 where rel.idPlataforma2 == id && pub.estado == "Activo"
                                 select pub).ToList();

            ViewBag.PlataformaId = id;
            return View(publicaciones);
        }

        // GET: Crear publicación
        [HttpGet]
        public ActionResult CrearPublicacion(long id)
        {
            ViewBag.PlataformaId = id;

            // Obtener el id del usuario logueado (ajústalo según como guardes la sesión)
            if (Session["UsuarioID"] == null)
                return RedirectToAction("Login", "Account");

            long usuarioId = Convert.ToInt64(Session["UsuarioID"]);

            using (var db = new SmartSysDbContext())
            {
                var relacion = db.usuario_plataforma
                    .FirstOrDefault(up => up.idUsuario4 == usuarioId && up.idPlataforma1 == id);

                if (relacion != null)
                {
                    ViewBag.RolUsuario = relacion.rolUsuarioPlataforma;
                }
                else
                {
                    // Si no pertenece a la plataforma, por defecto tratamos como Miembro
                    ViewBag.RolUsuario = "Miembro";
                }
            }

            return View(new Publicaciones());
        }


        // POST: Crear publicación
        [HttpPost]
        public ActionResult CrearPublicacion(long id, Publicaciones pub, HttpPostedFileBase archivo)
        {
            long idUsuario = Convert.ToInt64(Session["UsuarioID"]);

            // ✅ Validación especial si es Tarea
            if (pub.tipoPublicacion == "Tarea")
            {
                if (!pub.fechaEntrega.HasValue)
                {
                    ModelState.AddModelError("fechaEntrega", "Debe seleccionar una fecha de entrega.");
                }
                else if (pub.fechaEntrega.Value.Date < DateTime.Now.Date)
                {
                    ModelState.AddModelError("fechaEntrega", "La fecha de entrega no puede ser en el pasado.");
                }
            }

            if (ModelState.IsValid)
            {
                pub.fechaPublicacion = DateTime.Now.Date;
                pub.horaPublicacion = DateTime.Now.TimeOfDay;
                pub.estado = "Activo";

                if (archivo != null && archivo.ContentLength > 0)
                {
                    using (var br = new BinaryReader(archivo.InputStream))
                    {
                        pub.archivoAdjunto = br.ReadBytes(archivo.ContentLength);
                    }
                }

                db.Publicaciones.Add(pub);
                db.SaveChanges();

                // Asociar publicación a plataforma
                db.plataforma_publicacion.Add(new plataforma_publicacion
                {
                    idPlataforma2 = id,
                    idPublicacion2 = pub.idPublicacion
                });

                // Asociar usuario creador
                db.usuario_publicaciones.Add(new usuario_publicaciones
                {
                    idUsuario1 = idUsuario,
                    idPublicacion1 = pub.idPublicacion
                });

                db.SaveChanges();

                // 🔹 Verificar rol del usuario en la plataforma
                var relacion = db.usuario_plataforma
                    .FirstOrDefault(up => up.idUsuario4 == idUsuario && up.idPlataforma1 == id);

                if (relacion != null && relacion.rolUsuarioPlataforma == "Admin")
                {
                    return RedirectToAction("Contenido", new { id = id });
                }
                else
                {
                    return RedirectToAction("Publicaciones", new { id = id });
                }
            }

            // ❌ Si hubo error de validación, volvemos a la vista
            ViewBag.PlataformaId = id;
            return View(pub);
        }


        // Ver detalles
        public ActionResult VerPublicacion(long id)
        {
            // Traer la publicación
            var publicacion = db.Publicaciones.FirstOrDefault(p => p.idPublicacion == id);

            if (publicacion == null)
                return HttpNotFound();

            // Obtener el autor
            var autor = (from up in db.usuario_publicaciones
                         join usu in db.Usuario
                             on up.idUsuario1 equals usu.IdUsuario
                         where up.idPublicacion1 == publicacion.idPublicacion
                         select usu.Nombre + " " + usu.Apellido).FirstOrDefault();

            ViewBag.Autor = autor ?? "Desconocido";

            return View(publicacion);
        }


        // GET: Editar publicación
        public ActionResult EditarPublicacion(long id)
        {
            var pub = db.Publicaciones.Find(id);
            return View(pub);
        }

        // POST: Editar
        [HttpPost]
        public ActionResult EditarPublicacion(Publicaciones pubActualizada, HttpPostedFileBase archivo)
        {
            var pub = db.Publicaciones.Find(pubActualizada.idPublicacion);
            if (pub != null)
            {
                pub.titulo = pubActualizada.titulo;
                pub.contenido = pubActualizada.contenido;
                pub.tipoPublicacion = pubActualizada.tipoPublicacion;

                if (archivo != null && archivo.ContentLength > 0)
                {
                    using (var br = new BinaryReader(archivo.InputStream))
                    {
                        pub.archivoAdjunto = br.ReadBytes(archivo.ContentLength);
                    }
                }

                db.SaveChanges();
                return RedirectToAction("VerPublicacion", new { id = pub.idPublicacion });
            }

            return HttpNotFound();
        }

        // Eliminar
        public ActionResult EliminarPublicacion(long id, long idPlataforma)
        {
            var pub = db.Publicaciones.Find(id);
            if (pub != null)
            {
                pub.estado = "Inactivo";
                db.SaveChanges();
            }

            return RedirectToAction("Contenido", new { id = idPlataforma });
        }
        //Entrega de Tarea
        [HttpGet]
        public ActionResult SubirTarea(long idPublicacion)
        {
            long idUsuario = Convert.ToInt64(Session["UsuarioID"]);

            var entrega = db.usuario_publicaciones
                            .FirstOrDefault(up => up.idPublicacion1 == idPublicacion && up.idUsuario1 == idUsuario);

            if (entrega == null)
            {
                entrega = new usuario_publicaciones
                {
                    idPublicacion1 = idPublicacion,
                    idUsuario1 = idUsuario,
                    EstadoEntrega = "Pendiente"
                };
            }

            return View(entrega);
        }

        [HttpPost]
        public ActionResult SubirTarea(long idPublicacion, HttpPostedFileBase archivoTarea)
        {
            long idUsuario = Convert.ToInt64(Session["UsuarioID"]);

            var entrega = db.usuario_publicaciones
                            .FirstOrDefault(up => up.idPublicacion1 == idPublicacion && up.idUsuario1 == idUsuario);

            if (entrega == null)
            {
                entrega = new usuario_publicaciones
                {
                    idPublicacion1 = idPublicacion,
                    idUsuario1 = idUsuario
                };
                db.usuario_publicaciones.Add(entrega);
            }

            if (archivoTarea != null && archivoTarea.ContentLength > 0)
            {
                using (var br = new BinaryReader(archivoTarea.InputStream))
                {
                    entrega.EntregaTarea = br.ReadBytes(archivoTarea.ContentLength);
                    entrega.FechaEntregaUsuario = DateTime.Now;
                    entrega.EstadoEntrega = "Entregado";
                }
            }

            db.SaveChanges();

            // Redirige al contenido de la plataforma
            var plataformaId = db.plataforma_publicacion
                                .Where(p => p.idPublicacion2 == idPublicacion)
                                .Select(p => p.idPlataforma2)
                                .FirstOrDefault();

            return RedirectToAction("Publicaciones", new { id = plataformaId });
        }
        //Ver Entregas
        public ActionResult VerEntregasTarea(long idPublicacion)
        {
            var entregas = (from up in db.usuario_publicaciones
                            join u in db.Usuario on up.idUsuario1 equals u.IdUsuario
                            join p in db.Publicaciones on up.idPublicacion1 equals p.idPublicacion
                            join pp in db.plataforma_publicacion on p.idPublicacion equals pp.idPublicacion2
                            join usp in db.usuario_plataforma
                                on new { u.IdUsuario, pp.idPlataforma2 } equals new { IdUsuario = usp.idUsuario4, idPlataforma2 = usp.idPlataforma1 }
                            where up.idPublicacion1 == idPublicacion
                            select new EntregaTareaViewModel
                            {
                                IdUsuario = u.IdUsuario,
                                NombreUsuario = u.Nombre,
                                EntregaTarea = up.EntregaTarea,
                                FechaEntregaUsuario = up.FechaEntregaUsuario,
                                EstadoEntrega = up.EstadoEntrega,
                                IdPublicacion = p.idPublicacion,
                                PublicacionTitulo = p.titulo,
                                rolUsuarioPlataforma = usp.rolUsuarioPlataforma
                            }).ToList();

            if (entregas.Count > 0 && db.Publicaciones.Find(idPublicacion).tipoPublicacion != "Tarea")
            {
                var plataformaId = db.plataforma_publicacion
                                    .Where(pp => pp.idPublicacion2 == idPublicacion)
                                    .Select(pp => pp.idPlataforma2)
                                    .FirstOrDefault();
                return RedirectToAction("Contenido", new { id = plataformaId });
            }

            ViewBag.Publicacion = entregas.FirstOrDefault()?.PublicacionTitulo ?? "Tarea";

            return View(entregas);
        }



    }
}
