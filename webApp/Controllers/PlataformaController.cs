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

            if (!esAdmin)
                return RedirectToAction("Explorar");

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
            return View();
        }

        // POST: Crear publicación
        [HttpPost]
        public ActionResult CrearPublicacion(long id, Publicaciones pub, HttpPostedFileBase archivo)
        {
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
                long idUsuario = Convert.ToInt64(Session["UsuarioID"]);
                db.usuario_publicaciones.Add(new usuario_publicaciones
                {
                    idUsuario1 = idUsuario,
                    idPublicacion1 = pub.idPublicacion
                });

                db.SaveChanges();
                return RedirectToAction("Contenido", new { id = id });
            }

            ViewBag.PlataformaId = id;
            return View(pub);
        }

        // Ver detalles
        public ActionResult VerPublicacion(long id)
        {
            var pub = db.Publicaciones.Find(id);
            return View(pub);
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


    }
}
