using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartSys.Models
{
    [Table("ChatMensajes")]
    public class ChatMensajes
    {
        [Key]
        public long idMensaje { get; set; }

        [Required]
        public long idChat { get; set; }

        [Required]
        public long idUsuarioEmisor { get; set; }

        [Required]
        public long idUsuarioReceptor { get; set; }

        [Required]
        public string mensaje { get; set; }

        public DateTime fecha { get; set; } = DateTime.Now;

        // 🔗 Relaciones
        [ForeignKey("idChat")]
        public virtual ChatMsj Chat { get; set; }

        [ForeignKey("idUsuarioEmisor")]
        public virtual Usuario UsuarioEmisor { get; set; }

        [ForeignKey("idUsuarioReceptor")]
        public virtual Usuario UsuarioReceptor { get; set; }
    }
}
