using SmartSys.Models;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web.Mvc;

namespace SmartSys.Controllers
{
    public class ChatController : Controller
    {
        SmartSysDbContext db = new SmartSysDbContext();

        // ================
        // LISTADO DE CHATS PRIVADOS
        // ================
        [HttpGet]
        public ActionResult Index(string busqueda = "")
        {
            long idUsuarioActual = Convert.ToInt64(Session["idUsuario"]); // Usuario logueado

            // Buscar mensajes privados donde participe el usuario actual (como emisor o receptor)
            var mensajesPrivados = db.usuario_mensajes
                .Include(um => um.Mensaje)
                .Include(um => um.Mensaje.Usuario) // Usuario que envió el mensaje
                .Include(um => um.UsuarioEmisor)
                .Include(um => um.UsuarioReceptor)
                .Where(um => um.idUsuarioEmisor == idUsuarioActual || um.idUsuarioReceptor == idUsuarioActual)
                .Where(um => um.Mensaje.idGrupo == null) // Solo mensajes privados (no de grupo)
                .ToList(); // Ejecutar la consulta primero

            // Agrupar por conversación (emisor-receptor) en memoria
            var conversaciones = mensajesPrivados
                .GroupBy(um => um.idUsuarioEmisor == idUsuarioActual ? um.idUsuarioReceptor : um.idUsuarioEmisor)
                .Select(g => new {
                    OtroUsuario = g.Key,
                    UltimoMensaje = g.OrderByDescending(um => um.Mensaje.fechaHora).FirstOrDefault(),
                    OtroUsuarioObj = g.FirstOrDefault(um => um.idUsuarioEmisor == idUsuarioActual)?.UsuarioReceptor ??
                                   g.FirstOrDefault(um => um.idUsuarioReceptor == idUsuarioActual)?.UsuarioEmisor
                })
                .Where(c => c.UltimoMensaje != null)
                .ToList();

            // Filtro de búsqueda por nombre de usuario
            if (!string.IsNullOrEmpty(busqueda))
            {
                conversaciones = conversaciones.Where(c =>
                    c.OtroUsuarioObj != null &&
                    (c.OtroUsuarioObj.Nombre + " " + c.OtroUsuarioObj.Apellido).Contains(busqueda))
                    .ToList();
            }

            return View(conversaciones);
        }

        // ============================
        // CHAT PRIVADO (MENSAJES)
        // ============================
        [HttpGet]
        public ActionResult ChatMensajes(long idOtroUsuario)
        {
            long idUsuarioActual = Convert.ToInt64(Session["idUsuario"]);

            // Traer todos los mensajes entre estos dos usuarios
            var mensajes = db.usuario_mensajes
                .Include(um => um.Mensaje)
                .Include(um => um.Mensaje.Usuario)
                .Include(um => um.UsuarioEmisor)
                .Include(um => um.UsuarioReceptor)
                .Where(um =>
                    (um.idUsuarioEmisor == idUsuarioActual && um.idUsuarioReceptor == idOtroUsuario) ||
                    (um.idUsuarioEmisor == idOtroUsuario && um.idUsuarioReceptor == idUsuarioActual))
                .Where(um => um.Mensaje.idGrupo == null) // Solo mensajes privados
                .OrderBy(um => um.Mensaje.fechaHora)
                .ToList();

            // Obtener información del otro usuario
            var otroUsuario = db.Usuario.FirstOrDefault(u => u.IdUsuario == idOtroUsuario);

            if (otroUsuario == null)
            {
                return HttpNotFound();
            }

            ViewBag.OtroUsuario = otroUsuario;
            ViewBag.IdOtroUsuario = idOtroUsuario;

            return View(mensajes);
        }

        [HttpPost]
        public ActionResult EnviarMensajePrivado(long idOtroUsuario, string contenido)
        {
            long idUsuarioActual = Convert.ToInt64(Session["idUsuario"]);

            // Crear el mensaje
            var mensaje = new Mensajes
            {
                idUsuario = idUsuarioActual,
                idGrupo = null, // Mensaje privado
                contenidoMensaje = contenido,
                estadoMensaje = "Enviado",
                fechaHora = DateTime.Now
            };

            db.Mensajes.Add(mensaje);
            db.SaveChanges();

            // Crear la relación usuario_mensaje
            var usuarioMensaje = new usuario_mensajes
            {
                idUsuarioEmisor = idUsuarioActual,
                idUsuarioReceptor = idOtroUsuario,
                idMensaje = mensaje.idMensaje,
                fechaCreacion = DateTime.Now
            };

            db.usuario_mensajes.Add(usuarioMensaje);
            db.SaveChanges();

            return RedirectToAction("ChatMensajes", new { idOtroUsuario = idOtroUsuario });
        }

        // ============================
        // LISTADO DE GRUPOS
        // ============================
        [HttpGet]
        public ActionResult Grupos()
        {
            long idUsuarioActual = Convert.ToInt64(Session["idUsuario"]);

            // Traer los grupos donde participa el usuario
            var grupos = db.usuario_grupos
                .Include(ug => ug.Grupo)
                .Include(ug => ug.Grupo.Mensajes)
                .Where(ug => ug.idUsuario == idUsuarioActual && ug.estadoMiembro == "Activo")
                .Select(ug => ug.Grupo)
                .ToList();

            return View(grupos);
        }

        // ============================
        // CHAT DE GRUPO
        // ============================
        [HttpGet]
        public ActionResult ChatGrupo(long idGrupo)
        {
            long idUsuarioActual = Convert.ToInt64(Session["idUsuario"]);

            // Verificar que el usuario pertenezca al grupo
            var perteneceAlGrupo = db.usuario_grupos
                .Any(ug => ug.idUsuario == idUsuarioActual &&
                          ug.idGrupo == idGrupo &&
                          ug.estadoMiembro == "Activo");

            if (!perteneceAlGrupo)
            {
                return HttpNotFound();
            }

            // Traer grupo con mensajes
            var grupo = db.Grupos
                .Include(g => g.Mensajes)
                .Include(g => g.Mensajes.Select(m => m.Usuario)) // Incluir usuario de cada mensaje
                .FirstOrDefault(g => g.idGrupo == idGrupo);

            if (grupo == null)
            {
                return HttpNotFound();
            }

            // Traer miembros del grupo
            var miembros = db.usuario_grupos
                .Include(ug => ug.Usuario)
                .Where(ug => ug.idGrupo == idGrupo && ug.estadoMiembro == "Activo")
                .ToList();

            ViewBag.Miembros = miembros;

            return View(grupo);
        }

        [HttpPost]
        public ActionResult EnviarMensajeGrupo(long idGrupo, string contenido)
        {
            long idUsuarioActual = Convert.ToInt64(Session["idUsuario"]);

            // Verificar que el usuario pertenezca al grupo
            var perteneceAlGrupo = db.usuario_grupos
                .Any(ug => ug.idUsuario == idUsuarioActual &&
                          ug.idGrupo == idGrupo &&
                          ug.estadoMiembro == "Activo");

            if (!perteneceAlGrupo)
            {
                return HttpNotFound();
            }

            var mensaje = new Mensajes
            {
                idUsuario = idUsuarioActual,
                idGrupo = idGrupo,
                contenidoMensaje = contenido,
                estadoMensaje = "Enviado",
                fechaHora = DateTime.Now
            };

            db.Mensajes.Add(mensaje);
            db.SaveChanges();

            return RedirectToAction("ChatGrupo", new { idGrupo = idGrupo });
        }

        // ============================
        // MÉTODOS AUXILIARES
        // ============================

        // Buscar usuarios para iniciar conversación
        [HttpGet]
        public ActionResult BuscarUsuarios(string termino)
        {
            long idUsuarioActual = Convert.ToInt64(Session["idUsuario"]);

            var usuarios = db.Usuario
                .Where(u => u.IdUsuario != idUsuarioActual &&
                           (u.Nombre + " " + u.Apellido).Contains(termino))
                .Take(10)
                .Select(u => new {
                    id = u.IdUsuario,
                    nombre = u.Nombre + " " + u.Apellido,
                    email = u.CorreoElectronico
                })
                .ToList();

            return Json(usuarios, JsonRequestBehavior.AllowGet);
        }

        // Crear nuevo grupo
        [HttpPost]
        public ActionResult CrearGrupo(string nombreGrupo, string descripcionGrupo)
        {
            long idUsuarioActual = Convert.ToInt64(Session["idUsuario"]);

            var grupo = new Grupos
            {
                nombreGrupo = nombreGrupo,
                descripcionGrupo = descripcionGrupo,
                fechaCreacion = DateTime.Now
            };

            db.Grupos.Add(grupo);
            db.SaveChanges();

            // Agregar al creador como administrador del grupo
            var miembro = new usuario_grupos
            {
                idUsuario = idUsuarioActual,
                idGrupo = grupo.idGrupo,
                rolUsuarioGrupo = "Administrador",
                fechaUnion = DateTime.Now,
                estadoMiembro = "Activo"
            };

            db.usuario_grupos.Add(miembro);
            db.SaveChanges();

            return RedirectToAction("ChatGrupo", new { idGrupo = grupo.idGrupo });
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}