using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace SmartSys.Models
{
    public class Grupos
    {
        [Key]
        public long idGrupo { get; set; }
        public string nombreGrupo { get; set; }
        public string descripcionGrupo { get; set; }
        public DateTime fechaCreacion { get; set; }
        public byte[] imagenGrupo { get; set; }
        public byte[] fondoGrupo { get; set; }

        // Relaciones
        public virtual ICollection<Mensajes> Mensajes { get; set; }
        public virtual ICollection<usuario_grupos> usuario_grupos { get; set; }

    }
}