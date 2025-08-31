using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartSys.Models
{
    [Table("Plataforma")]
    public class Plataforma
    {
        [Key]
        public long idPlataforma { get; set; }

        [Display(Name = "Nombre de la Plataforma")]
        public string nombrePlataforma { get; set; }

        [Display(Name = "Capacidad de Miembros")]
        public int? capacidadMiembros_plataforma { get; set; }

        [Display(Name = "Privacidad")]
        public string privacidadPlataforma { get; set; } = "Privado";

        [Display(Name = "Descripción")]
        public string descripcionPlataforma { get; set; }

        [Display(Name = "Código de Plataforma")]
        public string codigoPlataforma { get; set; }

        [Display(Name = "Fecha de Creación")]
        public DateTime fechaCreacion { get; set; }

        [Display(Name = "Estado")]
        public string estadoPlataforma { get; set; } = "Activo";

        [Display(Name = "Icono de la Plataforma")]
        public byte[] iconoPlataforma { get; set; }

        [Display(Name = "Fondo de la Plataforma")]
        public byte[] fondoPlataforma { get; set; }

        // Campo auxiliar solo para subir archivos desde formulario (no se mapea a la BD)
        [NotMapped]
        public HttpPostedFileBase IconoFile { get; set; }

        [NotMapped]
        public HttpPostedFileBase FondoFile { get; set; }
    }
}
