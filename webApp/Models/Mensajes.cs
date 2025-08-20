using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace SmartSys.Models
{
    public class Mensajes
    {
        [Key]
        public long idMensaje { get; set; }

        public long idUsuario { get; set; }
        public long? idGrupo { get; set; }

        public string contenidoMensaje { get; set; }
        public byte[] archivoMensaje { get; set; }
        public string estadoMensaje { get; set; }
        public DateTime fechaHora { get; set; }

        // Relaciones
        [ForeignKey("idGrupo")]
        public virtual Grupos Grupo { get; set; }

        [ForeignKey("idUsuario")]
        public virtual Usuario Usuario { get; set; }

        public virtual ICollection<usuario_mensajes> usuario_mensajes { get; set; }
    }
}