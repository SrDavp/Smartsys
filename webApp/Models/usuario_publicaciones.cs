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

        // Archivo que sube el usuario como entrega de tarea
        public byte[] EntregaTarea { get; set; }

        // Fecha en que el usuario entregó la tarea
        public DateTime? FechaEntregaUsuario { get; set; }

        // Estado de la entrega: "Pendiente", "Entregado", "Retrasado"
        public string EstadoEntrega { get; set; } = "Pendiente";

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
    // ViewModel para mostrar entregas de tarea
    public class EntregaTareaViewModel
    {
        public long IdUsuario { get; set; }
        public string NombreUsuario { get; set; }
        public byte[] EntregaTarea { get; set; }
        public DateTime? FechaEntregaUsuario { get; set; }
        public string EstadoEntrega { get; set; }

        // Info de la publicación (tarea)
        public long IdPublicacion { get; set; }
        public string PublicacionTitulo { get; set; }
    }
}
