using Newtonsoft.Json.Serialization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.Entity;


namespace SmartSys.Models
{
    public class SmartSysDbContext : DbContext
    {

        public SmartSysDbContext() : base("SmartSysConnection") { this.Database.CommandTimeout = 3000; }
        //Tablas Normales
        public DbSet<Usuario> Usuario { get; set; }
        public DbSet<Plataforma> Plataforma { get; set; }
        public DbSet<Publicaciones> Publicaciones { get; set; }
        public DbSet<Grupos> Grupos { get; set; }
        public DbSet<Mensajes> Mensajes { get; set; }
        //Tablas Intermedias
        public DbSet<plataforma_publicacion> plataforma_publicacion { get; set; }
        public DbSet<usuario_publicaciones> usuario_publicaciones { get; set; } 
        public DbSet<usuario_plataforma> usuario_plataforma { get; set; }
        public DbSet<usuario_mensajes> usuario_mensajes { get; set; }
        public DbSet<usuario_grupos> usuario_grupos { get; set; }
    }
}