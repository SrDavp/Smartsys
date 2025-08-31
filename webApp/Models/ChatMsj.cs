using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartSys.Models
{
    [Table("ChatMsj")]
    public class ChatMsj
    {
        [Key]
        public long idChat { get; set; }

        [Required]
        public long idUsuarioEmisor { get; set; }

        [Required]
        public long idUsuarioReceptor { get; set; }

        public string mensaje { get; set; }

        [Required]
        [StringLength(20)]
        public string estadoChat { get; set; } = "Activo";

        public DateTime fechaCreacion { get; set; } = DateTime.Now;

        public DateTime? fechamensaje { get; set; }

        public int totalMensajes { get; set; } = 0;

        // 🔗 Relaciones
        [ForeignKey("idUsuarioEmisor")]
        public virtual Usuario UsuarioEmisor { get; set; }

        [ForeignKey("idUsuarioReceptor")]
        public virtual Usuario UsuarioReceptor { get; set; }

        public virtual ICollection<ChatMensajes> Mensajes { get; set; }
    }
}
