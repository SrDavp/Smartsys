using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartSys.Models
{
    public class plataforma_publicacion
    {
        [Key, Column(Order = 0)]
        public long idPlataforma2 { get; set; }

        [Key, Column(Order = 1)]
        public long idPublicacion2 { get; set; }

        public DateTime fechaCreacion { get; set; } = DateTime.Now;

        [ForeignKey("idPlataforma2")]
        public virtual Plataforma Plataforma { get; set; }

        [ForeignKey("idPublicacion2")]
        public virtual Publicaciones Publicacion { get; set; }
    }
}