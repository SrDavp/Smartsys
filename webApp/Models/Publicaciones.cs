using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace SmartSys.Models
{
    public class Publicaciones
    {
        [Key]
        public long idPublicacion { get; set; }

        [Required]
        [StringLength(200)]
        public string titulo { get; set; }

        [Required]
        public string contenido { get; set; }

        [Required]
        [StringLength(20)]
        [Display(Name = "Tipo de Publicación")]
        public string tipoPublicacion { get; set; } = "Publicacion"; // Publicacion, Tarea, Anuncio

        public byte[] archivoAdjunto { get; set; }

        public DateTime? fechaPublicacion { get; set; }
        public TimeSpan? horaPublicacion { get; set; }

        [StringLength(20)]
        public string estado { get; set; } = "Activo";

        [Display(Name = "Fecha de Entrega")]
        [DataType(DataType.Date)]
        public DateTime? fechaEntrega { get; set; }




        //    // Relaciones (opcionales si quieres navegarlas)
        //    public virtual ICollection<plataforma_publicacion> plataformas { get; set; }
        //    public virtual ICollection<usuario_publicaciones> autores { get; set; }
        //
    }
}