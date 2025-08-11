using SmartSys.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SmartSys.Controllers
{
    public class ChatController : Controller
    {
        SmartSysDbContext db = new SmartSysDbContext();
        [HttpGet]
        public ActionResult Index(string busqueda = "")
        {
            db.Database.CommandTimeout = 180;
            // Obtener usuarios
            var usuarios = db.Usuario.AsNoTracking().AsQueryable();

            // Filtrar si se ha hecho una búsqueda
            if (!string.IsNullOrWhiteSpace(busqueda))
            {
                busqueda = busqueda.ToLower(); // Normalizar a minúsculas

                usuarios = usuarios.Where(u =>
                    u.Nombre.ToLower().Contains(busqueda) ||
                    u.Apellido.ToLower().Contains(busqueda));
            }

            ViewBag.Busqueda = busqueda;

            return View(usuarios.ToList());
        }
        public ActionResult Grupos()
        {
            return View();
        }
        public ActionResult ChatMensajes()
        {
            return View();
        }
        public ActionResult ChatGrupo()
        {
            return View();
        }
    }
}