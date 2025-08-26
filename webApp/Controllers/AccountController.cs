using SmartSys.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SmartSys.Controllers
{
    public class AccountController : Controller
    {
        SmartSysDbContext db = new SmartSysDbContext();

        // GET: Registro
        public ActionResult Registro()
        {
            return View();
        }

        [HttpPost]
        public ActionResult Registro(Usuario u, HttpPostedFileBase FotoPerfil)
        {
            //Validar contraseña
            if (string.IsNullOrEmpty(u.Contrasena) || u.Contrasena.Length < 8) {
                ViewBag.Error = "La contraseña debe tener almenos 8 caracteres";
                return View(u);
            }
            // Verificar si el correo ya está registrado
            var correoExistente = db.Usuario.Any(x => x.CorreoElectronico == u.CorreoElectronico);
            if (correoExistente)
            {
                ViewBag.Error = "El correo electrónico ya está en uso.";
                return View(u);
            }
            //Validar el telefono
            if (string.IsNullOrEmpty(u.Telefono) || u.Telefono.Length < 9 )
            {
                ViewBag.Error = "El número de teléfono tiene que tener 8 números y separado por un - ";
                return View(u);
            }
            //Validar foto de perfil 
            if (FotoPerfil == null || FotoPerfil.ContentLength == 0)
            {
                ViewBag.Error = "Debes subir una foto de perfil.";
                return View(u);
            }

            if (ModelState.IsValid)
            {
                // Hash de la contraseña
                u.Contrasena = BCrypt.Net.BCrypt.HashPassword(u.Contrasena);

                // Foto de perfil
                if (FotoPerfil != null && FotoPerfil.ContentLength > 0)
                {
                    using (var reader = new BinaryReader(FotoPerfil.InputStream))
                    {
                        u.Foto_perfil = reader.ReadBytes(FotoPerfil.ContentLength);
                    }
                }

                if (string.IsNullOrEmpty(u.TipoUsuario))
                {
                    u.TipoUsuario = "Usuario";
                }

                // ✅ Generar CodigoUnico directamente aquí
                string iniciales = "";
                if (!string.IsNullOrEmpty(u.Nombre)) iniciales += u.Nombre[0];
                if (!string.IsNullOrEmpty(u.Apellido)) iniciales += u.Apellido[0];
                iniciales = iniciales.ToUpper();

                // Generar bytes aleatorios en HEX
                byte[] randomBytes = new byte[2];
                using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
                {
                    rng.GetBytes(randomBytes);
                }
                string randomCode = BitConverter.ToString(randomBytes).Replace("-", "");
                u.CodigoUnico = iniciales + randomCode; // Ej: ER3F7C

                // Fecha de creación
                u.FechaCreacion = DateTime.Now;

                db.Usuario.Add(u);
                db.SaveChanges();
                return RedirectToAction("Login");
            }


            return View(u);
        }



        // GET: Login
        public ActionResult Login()
        {
            return View();
        }

        [HttpPost]
        public ActionResult Login(Usuario u)
        {
            var user = db.Usuario.FirstOrDefault(x => x.CorreoElectronico == u.CorreoElectronico);

            if (user != null && BCrypt.Net.BCrypt.Verify(u.Contrasena, user.Contrasena))
            {
                Session["UsuarioID"] = user.IdUsuario;
                Session["Nombre"] = user.Nombre;
                Session["Tipo"] = user.TipoUsuario;
                if (user.TipoUsuario == "superAdmin")
                {
                    return RedirectToAction("Index", "SuperAdmin");
                }

                return RedirectToAction("Index", "Home");
            }

            ViewBag.Error = "Correo o contraseña inválidos";
            return View(u);
        }


        public ActionResult Logout()
        {
            Session.Clear(); // ✅ Borra todo
            Session.Abandon(); // ✅ Cierra la sesión del todo
            return RedirectToAction("Login");
        }

        public ActionResult Perfil()
        {
            if (Session["UsuarioID"] == null)
                return RedirectToAction("Login");

            long id = Convert.ToInt64(Session["UsuarioID"]);
            var usuario = db.Usuario.Find(id);

            if (usuario == null)
                return HttpNotFound();

            return View(usuario);
        }

        [HttpPost]
        public ActionResult Perfil(Usuario u, HttpPostedFileBase FotoPerfil)
        {
            if (Session["UsuarioID"] == null)
                return RedirectToAction("Login");

            var usuario = db.Usuario.Find(u.IdUsuario);

            if (usuario != null)
            {
                usuario.Nombre = u.Nombre;
                usuario.Apellido = u.Apellido;
                usuario.CorreoElectronico = u.CorreoElectronico;
                usuario.Telefono = u.Telefono;
                usuario.Biografia = u.Biografia;

                if (FotoPerfil != null && FotoPerfil.ContentLength > 0)
                {
                    using (var reader = new System.IO.BinaryReader(FotoPerfil.InputStream))
                    {
                        usuario.Foto_perfil = reader.ReadBytes(FotoPerfil.ContentLength);
                    }
                }

                db.SaveChanges();
                return RedirectToAction("Perfil");
            }
            return View(u);
        }

    }
}