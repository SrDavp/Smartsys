using SmartSys.Models;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SmartSys.Controllers
{
    public class SuperAdminController : Controller
    {
        SmartSysDbContext db = new SmartSysDbContext();

        [HttpGet]
        public ActionResult Index(string busqueda = "")
        {
            db.Database.CommandTimeout = 180;

            // Validar sesión
            if (Session["Tipo"]?.ToString() != "superAdmin")
                return RedirectToAction("Login", "Account");

            // Obtener usuarios
            var usuarios = db.Usuario.AsNoTracking().AsQueryable();

            // Filtrar si se ha hecho una búsqueda
            if (!string.IsNullOrWhiteSpace(busqueda))
            {
                busqueda = busqueda.ToLower(); // Normalizar a minúsculas

                usuarios = usuarios.Where(u =>
                    u.Nombre.ToLower().Contains(busqueda) ||
                    u.Apellido.ToLower().Contains(busqueda) ||
                    u.CorreoElectronico.ToLower().Contains(busqueda));
            }

            ViewBag.Busqueda = busqueda;

            return View(usuarios.ToList());
        }



        public ActionResult Crear()
        {
            if (Session["Tipo"]?.ToString() != "superAdmin")
                return RedirectToAction("Login", "Account");

            return View();
        }

        [HttpPost]
        public ActionResult Crear(Usuario u, HttpPostedFileBase FotoPerfil)
        {
            if (Session["Tipo"]?.ToString() != "superAdmin")
                return RedirectToAction("Login", "Account");

            if (ModelState.IsValid)
            {
                // Hash de contraseña
                u.Contrasena = BCrypt.Net.BCrypt.HashPassword(u.Contrasena);

                // Foto de perfil (opcional)
                if (FotoPerfil != null && FotoPerfil.ContentLength > 0)
                {
                    using (var reader = new BinaryReader(FotoPerfil.InputStream))
                    {
                        u.Foto_perfil = reader.ReadBytes(FotoPerfil.ContentLength);
                    }
                }

                u.FechaCreacion = DateTime.Now;
                db.Usuario.Add(u);
                db.SaveChanges();
                return RedirectToAction("Index");
            }

            return View(u);
        }

        public ActionResult Editar(long id)
        {
            if (Session["Tipo"]?.ToString() != "superAdmin")
                return RedirectToAction("Login", "Account");

            var user = db.Usuario.Find(id);
            if (user == null) return HttpNotFound();
            return View(user);
        }

        [HttpPost]
        public ActionResult Editar(Usuario u, HttpPostedFileBase FotoPerfil)
        {
            if (Session["Tipo"]?.ToString() != "superAdmin")
                return RedirectToAction("Login", "Account");

            var user = db.Usuario.Find(u.IdUsuario);
            if (user != null)
            {
                user.Nombre = u.Nombre;
                user.Apellido = u.Apellido;
                user.CorreoElectronico = u.CorreoElectronico;
                user.Telefono = u.Telefono;
                user.TipoUsuario = u.TipoUsuario;
                user.Biografia = u.Biografia;

                if (FotoPerfil != null && FotoPerfil.ContentLength > 0)
                {
                    using (var reader = new BinaryReader(FotoPerfil.InputStream))
                    {
                        user.Foto_perfil = reader.ReadBytes(FotoPerfil.ContentLength);
                    }
                }

                db.SaveChanges();
                return RedirectToAction("Index");
            }

            return View(u);
        }

        public ActionResult Eliminar(long id)
        {
            if (Session["Tipo"]?.ToString() != "superAdmin")
                return RedirectToAction("Login", "Account");

            var user = db.Usuario.Find(id);
            if (user == null) return HttpNotFound();

            db.Usuario.Remove(user);
            db.SaveChanges();
            return RedirectToAction("Index");
        }


        //Todo de plataformas editar y eliminar y crear
        [HttpGet]
        public ActionResult Plataformas(string busqueda = "", string estado = "")
        {
            if (Session["Tipo"]?.ToString() != "superAdmin")
                return RedirectToAction("Login", "Account");

            var plataformas = db.Plataforma.AsQueryable();

            if (!string.IsNullOrEmpty(busqueda))
            {
                plataformas = plataformas.Where(p =>
                    p.nombrePlataforma.Contains(busqueda) ||
                    p.descripcionPlataforma.Contains(busqueda));
            }

            if (!string.IsNullOrEmpty(estado))
            {
                plataformas = plataformas.Where(p => p.estadoPlataforma == estado);
            }

            ViewBag.Busqueda = busqueda;
            ViewBag.Estado = estado;

            return View(plataformas.ToList());
        }


        [HttpGet]
        public ActionResult CrearPlataforma()
        {
            return View();
        }

        [HttpPost]
        public ActionResult CrearPlataforma(Plataforma p, HttpPostedFileBase IconoFile, HttpPostedFileBase FondoFile)
        {
            if (ModelState.IsValid)
                p.codigoPlataforma = Guid.NewGuid().ToString("N").Substring(0, 10);
            p.fechaCreacion = DateTime.Now;
            {
                if (IconoFile != null)
                {
                    using (var reader = new BinaryReader(IconoFile.InputStream))
                        p.iconoPlataforma = reader.ReadBytes(IconoFile.ContentLength);
                }

                if (FondoFile != null)
                {
                    using (var reader = new BinaryReader(FondoFile.InputStream))
                        p.fondoPlataforma = reader.ReadBytes(FondoFile.ContentLength);
                }

                p.fechaCreacion = DateTime.Now;
                db.Plataforma.Add(p);
                db.SaveChanges();
                return RedirectToAction("Plataformas");
            }
            return View(p);
        }

        [HttpGet]
        public ActionResult EditarPlataforma(long id)
        {
            var plataforma = db.Plataforma.Find(id);
            if (plataforma == null) return HttpNotFound();
            return View(plataforma);
        }

        [HttpPost]
        public ActionResult EditarPlataforma(Plataforma p, HttpPostedFileBase IconoFile, HttpPostedFileBase FondoFile)
        {
            var plataforma = db.Plataforma.Find(p.idPlataforma);
            if (plataforma != null)
            {
                plataforma.nombrePlataforma = p.nombrePlataforma;
                plataforma.capacidadMiembros_plataforma = p.capacidadMiembros_plataforma;
                plataforma.privacidadPlataforma = p.privacidadPlataforma;
                plataforma.descripcionPlataforma = p.descripcionPlataforma;
                plataforma.codigoPlataforma = p.codigoPlataforma;
                plataforma.estadoPlataforma = p.estadoPlataforma;

                if (IconoFile != null)
                {
                    using (var reader = new BinaryReader(IconoFile.InputStream))
                        plataforma.iconoPlataforma = reader.ReadBytes(IconoFile.ContentLength);
                }

                if (FondoFile != null)
                {
                    using (var reader = new BinaryReader(FondoFile.InputStream))
                        plataforma.fondoPlataforma = reader.ReadBytes(FondoFile.ContentLength);
                }

                db.SaveChanges();
                return RedirectToAction("Plataformas");
            }
            return View(p);
        }

        [HttpGet]
        public ActionResult EliminarPlataforma(long id)
        {
            var plataforma = db.Plataforma.Find(id);
            if (plataforma == null) return HttpNotFound();

            db.Plataforma.Remove(plataforma);
            db.SaveChanges();
            return RedirectToAction("Plataformas");
        }

        //Todo lo de Publicaciones de Super Admin

        // LISTADO DE PUBLICACIONES
        // LISTADO DE PUBLICACIONES POR PLATAFORMA
        public ActionResult Publicaciones(long id, string titulo, string tipo, string estado, string usuario, DateTime? fecha)
        {
            if (Session["Tipo"]?.ToString() != "superAdmin")
                return RedirectToAction("Login", "Account");

            var publicacionesConUsuarios = from rel1 in db.plataforma_publicacion
                                           join pub in db.Publicaciones on rel1.idPublicacion2 equals pub.idPublicacion
                                           join rel2 in db.usuario_publicaciones on pub.idPublicacion equals rel2.idPublicacion1
                                           join user in db.Usuario on rel2.idUsuario1 equals user.IdUsuario
                                           where rel1.idPlataforma2 == id
                                           select new PublicacionConUsuario
                                           {
                                               Publicacion = pub,
                                               Usuario = user
                                           };

            // Aplicar filtros
            if (!string.IsNullOrEmpty(titulo))
                publicacionesConUsuarios = publicacionesConUsuarios.Where(p => p.Publicacion.titulo.Contains(titulo));

            if (!string.IsNullOrEmpty(tipo))
                publicacionesConUsuarios = publicacionesConUsuarios.Where(p => p.Publicacion.tipoPublicacion == tipo);

            if (!string.IsNullOrEmpty(estado))
                publicacionesConUsuarios = publicacionesConUsuarios.Where(p => p.Publicacion.estado == estado);

            if (!string.IsNullOrEmpty(usuario))
                publicacionesConUsuarios = publicacionesConUsuarios.Where(p =>
                    p.Usuario.Nombre.Contains(usuario) || p.Usuario.Apellido.Contains(usuario));

            if (fecha.HasValue)
            {
                var selectedDate = fecha.Value.Date;
                publicacionesConUsuarios = publicacionesConUsuarios.Where(p =>
                    DbFunctions.TruncateTime(p.Publicacion.fechaPublicacion) == selectedDate);
            }

            ViewBag.PlataformaId = id;
            return View("Publicaciones", publicacionesConUsuarios.ToList());
        }


        // CREAR PUBLICACIÓN
        // GET
        public ActionResult CrearPublicacion(long idPlataforma)
        {
            ViewBag.idPlataforma = idPlataforma;
            return View();
        }

        // POST
        [HttpPost]
        public ActionResult CrearPublicacion(Publicaciones publicacion, HttpPostedFileBase Archivo, long idPlataforma)
        {
            db.Database.CommandTimeout = 380;
            if (ModelState.IsValid)
            {
                if (Archivo != null && Archivo.ContentLength > 0)
                {
                    using (var reader = new BinaryReader(Archivo.InputStream))
                    {
                        publicacion.archivoAdjunto = reader.ReadBytes(Archivo.ContentLength);
                    }
                }

                publicacion.fechaPublicacion = DateTime.Now;
                publicacion.estado = "Activo";

                db.Publicaciones.Add(publicacion);
                db.SaveChanges();

                // Relación con la plataforma
                var relacion = new plataforma_publicacion
                {
                    idPlataforma2 = idPlataforma,
                    idPublicacion2 = publicacion.idPublicacion,
                    fechaCreacion = DateTime.Now
                };
                db.plataforma_publicacion.Add(relacion);
                // Relación con el usuario
                long idUsuario = Convert.ToInt64(Session["UsuarioID"]);
                var relacionUsuario = new usuario_publicaciones
                {
                    idUsuario1 = idUsuario,
                    idPublicacion1 = publicacion.idPublicacion,
                    fechaCreacion = DateTime.Now
                };
                db.usuario_publicaciones.Add(relacionUsuario);


                db.SaveChanges();
                return RedirectToAction("Publicaciones", new { id = idPlataforma });
            }

            ViewBag.idPlataforma = idPlataforma;
            return View(publicacion);
        }


        // EDITAR PUBLICACIÓN
        public ActionResult EditarPublicacion(long id)
        {
            if (Session["Tipo"]?.ToString() != "superAdmin")
                return RedirectToAction("Login", "Account");

            var pub = db.Publicaciones.Find(id);
            if (pub == null) return HttpNotFound();

            // Obtener el idPlataforma para pasarlo a la vista
            var relacion = db.plataforma_publicacion.FirstOrDefault(x => x.idPublicacion2 == id);
            ViewBag.idPlataforma = relacion?.idPlataforma2;

            return View(pub);
        }

        [HttpPost]
        public ActionResult EditarPublicacion(Publicaciones pub, HttpPostedFileBase archivoAdjuntoFile)
        {
            if (Session["Tipo"]?.ToString() != "superAdmin")
                return RedirectToAction("Login", "Account");

            var original = db.Publicaciones.Find(pub.idPublicacion);
            if (original == null) return HttpNotFound();

            // Obtener el idPlataforma ANTES de actualizar
            var relacion = db.plataforma_publicacion.FirstOrDefault(x => x.idPublicacion2 == pub.idPublicacion);
            long? idPlataforma = relacion?.idPlataforma2;

            original.titulo = pub.titulo;
            original.contenido = pub.contenido;
            original.tipoPublicacion = pub.tipoPublicacion;
            original.estado = pub.estado;
            original.fechaLimite = pub.fechaLimite;

            if (archivoAdjuntoFile != null && archivoAdjuntoFile.ContentLength > 0)
            {
                using (var reader = new BinaryReader(archivoAdjuntoFile.InputStream))
                {
                    original.archivoAdjunto = reader.ReadBytes(archivoAdjuntoFile.ContentLength);
                }
            }

            db.SaveChanges();

            // Redirigir a la página de publicaciones de la plataforma específica
            if (idPlataforma.HasValue)
                return RedirectToAction("Publicaciones", new { id = idPlataforma.Value });
            else
                return RedirectToAction("Plataformas"); // Fallback si no se encuentra la plataforma
        }

        // ELIMINAR PUBLICACIÓN (versión optimizada)
        public ActionResult EliminarPublicacion(long id)
        {
            if (Session["Tipo"]?.ToString() != "superAdmin")
                return RedirectToAction("Login", "Account");

            // Obtener publicación y plataforma en una sola consulta
            var resultado = (from pub in db.Publicaciones
                             join rel in db.plataforma_publicacion on pub.idPublicacion equals rel.idPublicacion2
                             where pub.idPublicacion == id
                             select new { Publicacion = pub, IdPlataforma = rel.idPlataforma2, Relacion = rel })
                             .FirstOrDefault();

            if (resultado == null) return HttpNotFound();

            // Eliminar relaciones
            var usuarioRelaciones = db.usuario_publicaciones.Where(x => x.idPublicacion1 == id);
            db.usuario_publicaciones.RemoveRange(usuarioRelaciones);
            db.plataforma_publicacion.Remove(resultado.Relacion);

            // Eliminar publicación
            db.Publicaciones.Remove(resultado.Publicacion);
            db.SaveChanges();

            return RedirectToAction("Publicaciones", new { id = resultado.IdPlataforma });
        }

        //Ver Publicaciones y a que plataforma Pertence el usuario
        // Mostrar plataformas a las que pertenece un usuario
        public ActionResult PlataformasUsuario(long id)
        {

            var plataformas = (from rel in db.usuario_plataforma
                               join p in db.Plataforma on rel.idPlataforma1 equals p.idPlataforma
                               where rel.idUsuario4 == id
                               select p).ToList();

            ViewBag.NombreUsuario = db.Usuario.Find(id)?.Nombre + " " + db.Usuario.Find(id)?.Apellido;
            return View(plataformas);
        }

        // Mostrar publicaciones hechas por un usuario y buscador
        public ActionResult PublicacionesUsuario(long id, string titulo = "", string tipo = "", string estado = "", DateTime? fecha = null)
        {
            var publicaciones = (from rel in db.usuario_publicaciones
                                 join p in db.Publicaciones on rel.idPublicacion1 equals p.idPublicacion
                                 where rel.idUsuario1 == id
                                 select p).AsQueryable();

            if (!string.IsNullOrWhiteSpace(titulo))
                publicaciones = publicaciones.Where(p => p.titulo.Contains(titulo));

            if (!string.IsNullOrWhiteSpace(tipo))
                publicaciones = publicaciones.Where(p => p.tipoPublicacion.Contains(tipo));

            if (!string.IsNullOrWhiteSpace(estado))
                publicaciones = publicaciones.Where(p => p.estado.Contains(estado));

            if (fecha.HasValue)
            {
                var fechaInicio = fecha.Value.Date;
                var fechaFin = fechaInicio.AddDays(1);

                publicaciones = publicaciones.Where(p =>
                    p.fechaPublicacion >= fechaInicio &&
                    p.fechaPublicacion < fechaFin);
            }

            ViewBag.NombreUsuario = db.Usuario.Find(id)?.Nombre + " " + db.Usuario.Find(id)?.Apellido;
            ViewBag.Titulo = titulo;
            ViewBag.Tipo = tipo;
            ViewBag.Estado = estado;
            ViewBag.Fecha = fecha?.ToString("yyyy-MM-dd");

            return View(publicaciones.ToList());
        }


    }
}

