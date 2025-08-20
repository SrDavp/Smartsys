using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace SmartSys.Models
{
    public class usuario_grupos
    {
        [Key, Column(Order = 0)]
        [ForeignKey("Usuario")]
        public long idUsuario { get; set; }

        [Key, Column(Order = 1)]
        [ForeignKey("Grupo")]
        public long idGrupo { get; set; }
        public string rolUsuarioGrupo { get; set; }
        public DateTime fechaUnion { get; set; }
        public string estadoMiembro { get; set; }

        // Relaciones
        public virtual Usuario Usuario { get; set; }
        public virtual Grupos Grupo { get; set; }
    }
}