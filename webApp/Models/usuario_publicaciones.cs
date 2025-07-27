using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartSys.Models
{
    public class usuario_publicaciones
    {
        [Key, Column(Order = 0)]
        public long idUsuario1 { get; set; }

        [Key, Column(Order = 1)]
        public long idPublicacion1 { get; set; }

        public DateTime fechaCreacion { get; set; } = DateTime.Now;

        [ForeignKey("idUsuario1")]
        public virtual Usuario Usuario { get; set; }

        [ForeignKey("idPublicacion1")]
        public virtual Publicaciones Publicacion { get; set; }
    }
        public class PublicacionConUsuario
        {
            public Publicaciones Publicacion { get; set; }
            public Usuario Usuario { get; set; }
        }
    }
