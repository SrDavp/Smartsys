using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace SmartSys.Models
{
    public class Usuario
    {
        [Key]
        public long IdUsuario { get; set; }

        [Required]
        public string Nombre { get; set; }

        public string Apellido { get; set; }

        [Required]
        [EmailAddress]
        public string CorreoElectronico { get; set; }

        [Required]
        public string Contrasena { get; set; }

        public string TipoUsuario { get; set; }

        public string EstadoCuenta { get; set; }

        public DateTime FechaCreacion { get; set; }

        public string Telefono { get; set; }
        public byte[] Foto_perfil { get; set; }  // Se guarda en la base de datos

        [NotMapped] // Esta propiedad es solo para recibir el archivo temporalmente desde el formulario
        public HttpPostedFileBase FotoPerfil { get; set; }

        public string Biografia { get; set; }

        public string CodigoUnico { get; set; }

    }
}