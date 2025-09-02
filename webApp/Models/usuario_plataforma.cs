using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartSys.Models
{
    [Table("usuario_plataforma")]
    public class usuario_plataforma
    {
        [Key, Column(Order = 0)]
        public long idUsuario4 { get; set; }

        [Key, Column(Order = 1)]
        public long idPlataforma1 { get; set; }
        [Display (Name = "Rol Usuario")]
        public string rolUsuarioPlataforma { get; set; } = "Miembro";

        public DateTime fechaUnion { get; set; } = DateTime.Now;

        public string estadoMiembro { get; set; } = "Activo";

        // Relaciones (si usas EF para navegación)
        [ForeignKey("idUsuario4")]
        public virtual Usuario Usuario { get; set; }

        [ForeignKey("idPlataforma1")]
        public virtual Plataforma Plataforma { get; set; }
    }

    public class MiembroViewModel
    {
        public Usuario Usuario { get; set; }
        public usuario_plataforma Relacion { get; set; }
    }

}
