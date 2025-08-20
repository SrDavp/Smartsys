using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace SmartSys.Models
{
    public class usuario_mensajes
    {
        [Key, Column(Order = 0)]
        [ForeignKey("UsuarioEmisor")]
        public long idUsuarioEmisor { get; set; }

        [Key, Column(Order = 1)]
        [ForeignKey("UsuarioReceptor")]
        public long idUsuarioReceptor { get; set; }

        [Key, Column(Order = 2)]
        [ForeignKey("Mensaje")]
        public long idMensaje { get; set; }
        public DateTime fechaCreacion { get; set; }

        // Relaciones
        public virtual Usuario UsuarioEmisor { get; set; }
        public virtual Usuario UsuarioReceptor { get; set; }
        public virtual Mensajes Mensaje { get; set; }
    }
}