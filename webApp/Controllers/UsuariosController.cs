using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using SmartSys.Models;

namespace SmartSys.Controllers
{
    public class UsuariosController : Controller
    {
        SmartSysDbContext db = new SmartSysDbContext();

        // GET: Usuarios
        public ActionResult Index()
        {
            var usuarios = db.Usuario.ToList();
            return View(usuarios);
        }
    }
}
