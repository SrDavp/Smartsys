
/* 
BASE DE DATOS SMARTSYS - CREAJ 2025 - COLEGIO  DON BOSCO

INTEGRANTES:
DANIEL ALEJANDRO VALENCIA PANIAGUA
ELMER EDUARDO RIVAS AVILES
JONATHAN ISAIAS ROSALES ELIAS
CHRISTOPHER ENRIQUE VILLACORTA MOLINA
*/
CREATE DATABASE SmartSys;
USE SmartSys;

/* 
NVARCHAR soporta UTF-8 en pocas palabras cosos que normalmente Varchar normal no xd 

Tablas principales de donde salen las demas tablas foraneas,consta de las siguientes tablas:
1 - Usuarios
2 - Plataformas
3 - Plantillas
4 - Componentes
5 - Almacenamiento
6 - Sistema Interno
7 - Grupos
8 - Mensajes
9 - Publicaciones
*/
/*Consultas*/

Select * from Usuarios;
Select * from Plataforma;
select * from Publicaciones;
Select * from usuario_plataforma;
Select * from Publicaciones
Select * from plataforma_publicacion
Select * from  usuario_publicaciones;

CREATE TABLE Usuarios(
	idUsuario BIGINT IDENTITY(1,1) PRIMARY KEY,
	nombre NVARCHAR (200) NOT NULL,
	apellido NVARCHAR (200) NOT NULL,
	correoElectronico NVARCHAR (150) NOT NULL UNIQUE,
	contrasena NVARCHAR (MAX) NOT NULL,
	telefono NVARCHAR (20) NULL,
	tipoUsuario NVARCHAR (20) NULL DEFAULT 'Usuario', /* Se remplaza el rol (ya no sera intermedia) */
	estadoCuenta NVARCHAR (20) NOT NULL DEFAULT 'Activo', /* EStado de la cuenta si esta activa o baneada */
	fechaCreacion DATETIME2 DEFAULT SYSDATETIME(),
	foto_perfil VARBINARY(MAX),
	biografia NVARCHAR (MAX) NULL,
	codigoUnico NVARCHAR(50) UNIQUE
);



CREATE TABLE ChatMsj (
    idChat BIGINT IDENTITY(1,1) PRIMARY KEY,
    idUsuarioEmisor BIGINT NOT NULL,
    idUsuarioReceptor BIGINT NOT NULL,
    mensaje NVARCHAR(MAX) NULL,
    estadoChat NVARCHAR(20) NOT NULL DEFAULT 'Activo',
    fechaCreacion DATETIME2 DEFAULT SYSDATETIME(),
    fechamensaje DATETIME2 NULL,
    totalMensajes INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_Chat_Emisor FOREIGN KEY (idUsuarioEmisor) REFERENCES Usuarios(idUsuario),
    CONSTRAINT FK_Chat_Receptor FOREIGN KEY (idUsuarioReceptor) REFERENCES Usuarios(idUsuario)
);

CREATE TABLE ChatMensajes (
  idMensaje       BIGINT IDENTITY(1,1) PRIMARY KEY,
  idChat          BIGINT NOT NULL,
  idUsuarioEmisor BIGINT NOT NULL,
  idUsuarioReceptor BIGINT NOT NULL,
  mensaje         NVARCHAR(MAX) NOT NULL,
  fecha           DATETIME2 DEFAULT SYSDATETIME(),
  CONSTRAINT FK_ChatMensajes_Chat     FOREIGN KEY (idChat) REFERENCES ChatMsj(idChat),
  CONSTRAINT FK_ChatMensajes_Emisor   FOREIGN KEY (idUsuarioEmisor) REFERENCES Usuarios(idUsuario),
  CONSTRAINT FK_ChatMensajes_Receptor FOREIGN KEY (idUsuarioReceptor) REFERENCES Usuarios(idUsuario)
);

CREATE TABLE Plataforma (
    idPlataforma BIGINT IDENTITY(1,1) PRIMARY KEY,
	nombrePlataforma NVARCHAR(MAX) NULL,
    capacidadMiembros_plataforma INT DEFAULT 100,
    privacidadPlataforma NVARCHAR(50) NOT NULL DEFAULT 'Privado',
    descripcionPlataforma NVARCHAR(MAX) NULL,
    codigoPlataforma NVARCHAR(100) UNIQUE NULL,
    fechaCreacion DATETIME2 DEFAULT SYSDATETIME(),
    estadoPlataforma NVARCHAR(20) DEFAULT 'Activo',
	iconoPlataforma VARBINARY(MAX),
	fondoPlataforma VARBINARY(MAX)
);

CREATE TABLE Grupos (
    idGrupo BIGINT IDENTITY(1,1) PRIMARY KEY,
    nombreGrupo NVARCHAR(200) NOT NULL,
    descripcionGrupo NVARCHAR(MAX) NULL,
    fechaCreacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    imagenGrupo VARBINARY(MAX) NULL, -- Foto de grupo
    fondoGrupo VARBINARY(MAX) NULL   -- Opcional, fondo del chat
);

CREATE TABLE Mensajes (
    idMensaje BIGINT IDENTITY(1,1) PRIMARY KEY,
    idUsuario BIGINT NOT NULL,
    idGrupo BIGINT NULL, -- NULL si es mensaje privado
    contenidoMensaje NVARCHAR(MAX) NULL, 
    archivoMensaje VARBINARY(MAX) NULL,
    estadoMensaje NVARCHAR(20) NOT NULL DEFAULT 'Enviado',
    fechaHora DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Mensajes_Usuarios FOREIGN KEY (idUsuario) REFERENCES Usuarios(idUsuario),
    CONSTRAINT FK_Mensajes_Grupos FOREIGN KEY (idGrupo) REFERENCES Grupos(idGrupo)
);

CREATE TABLE Plantillas(
    idPlantilla BIGINT IDENTITY(1,1) PRIMARY KEY,
	categoriaPlantilla NVARCHAR(50) NOT NULL DEFAULT 'N/A',
	pantillaCustom NVARCHAR(50) NOT NULL DEFAULT 'N/A'
);

CREATE TABLE Componentes (
    id_componente BIGINT IDENTITY(1,1) PRIMARY KEY,
    componentes_tipo NVARCHAR(50) NOT NULL, 
    componentes_categoria NVARCHAR(50) NULL,
    componentes_nombre NVARCHAR(200) NOT NULL,
    componentes_icono NVARCHAR(100) NULL,
    componentes_propiedades NVARCHAR(MAX) NULL,
    fecha_creacion DATETIME2 DEFAULT SYSDATETIME(),
    estado_componente NVARCHAR(20) DEFAULT 'Activo'
);

/*
CREATE TABLE Almacenamiento(
	idUsuario BIGINT IDENTITY(1,1) PRIMARY KEY,
	nombre NVARCHAR (200) NOT NULL,
	apellido NVARCHAR (200) NOT NULL,
	correo_electronico NVARCHAR (150) NOT NULL UNIQUE,
	contrasena_hash NVARCHAR (MAX) NOT NULL,
	telefono NVARCHAR (20) NULL,
    fecha_nacimiento DATE NULL,
	genero NVARCHAR (20) NULL,
	tipo_usuario NVARCHAR (20) NOT NULL DEFAULT 'Usuario', /* Basicamente el rol */
	estado_cuenta NVARCHAR (20) NOT NULL DEFAULT 'Activo', /* EStado de la cuenta si esta activa o baneada */
	fecha_creacion DATETIME2 DEFAULT SYSDATETIME(),
	foto_perfil VARBINARY(MAX),
	biografia NVARCHAR (MAX) NULL
);

CREATE TABLE SistemaInterno(
	idUsuario BIGINT IDENTITY(1,1) PRIMARY KEY,
	nombre NVARCHAR (200) NOT NULL,
	apellido NVARCHAR (200) NOT NULL,
	correo_electronico NVARCHAR (150) NOT NULL UNIQUE,
	contrasena_hash NVARCHAR (MAX) NOT NULL,
	telefono NVARCHAR (20) NULL,
    fecha_nacimiento DATE NULL,
	genero NVARCHAR (20) NULL,
	tipo_usuario NVARCHAR (20) NOT NULL DEFAULT 'Usuario', /* Basicamente el rol */
	estado_cuenta NVARCHAR (20) NOT NULL DEFAULT 'Activo', /* EStado de la cuenta si esta activa o baneada */
	fecha_creacion DATETIME2 DEFAULT SYSDATETIME(),
	foto_perfil VARBINARY(MAX),
	biografia NVARCHAR (MAX) NULL
);*/


CREATE TABLE Publicaciones (
    idPublicacion BIGINT IDENTITY(1,1) PRIMARY KEY,
    titulo NVARCHAR(200) NOT NULL,
    contenido NVARCHAR(MAX) NOT NULL,
    tipoPublicacion NVARCHAR(20) NOT NULL DEFAULT 'Publicacion', -- Publicacion, Tarea, Anuncio
    archivoAdjunto VARBINARY(MAX) NULL,
    fechaPublicacion DATE NULL,
    horaPublicacion TIME NULL,
    estado NVARCHAR(20) DEFAULT 'Activo'
);



/* ---------------------- FIN TABLAS PRINCIPALES --------------------*/

/* ---------------------- INICIO TABLAS INTERMEDIAS --------------------*/

/* ----------- Usuario -----------------*/
CREATE TABLE usuario_publicaciones(
	idUsuario1 BIGINT NOT NULL,
	idPublicacion1 BIGINT NOT NULL,
	fechaCreacion DATETIME2 DEFAULT SYSDATETIME(),
	PRIMARY KEY (idUsuario1, idPublicacion1),
	CONSTRAINT FK_usuario_publicaciones_Usuarios FOREIGN KEY (idUsuario1) REFERENCES Usuarios(idUsuario),
	CONSTRAINT FK_usuario_publicaciones_Publicaciones FOREIGN KEY (idPublicacion1) REFERENCES Publicaciones(idPublicacion)
);


CREATE TABLE usuario_mensajes (
    idUsuarioEmisor BIGINT NOT NULL,
    idUsuarioReceptor BIGINT NOT NULL,
    idMensaje BIGINT NOT NULL,
    fechaCreacion DATETIME2 DEFAULT SYSDATETIME(),
    PRIMARY KEY (idUsuarioEmisor, idUsuarioReceptor, idMensaje),
    CONSTRAINT FK_um_Usuarios_Emisor FOREIGN KEY (idUsuarioEmisor) REFERENCES Usuarios(idUsuario),
    CONSTRAINT FK_um_Usuarios_Receptor FOREIGN KEY (idUsuarioReceptor) REFERENCES Usuarios(idUsuario),
    CONSTRAINT FK_um_Mensajes FOREIGN KEY (idMensaje) REFERENCES Mensajes(idMensaje)
);

CREATE TABLE usuario_grupos (
    idUsuario BIGINT NOT NULL,
    idGrupo BIGINT NOT NULL,
    rolUsuarioGrupo NVARCHAR(50) DEFAULT 'Miembro',
    fechaUnion DATETIME2 DEFAULT SYSDATETIME(),
    estadoMiembro NVARCHAR(20) DEFAULT 'Activo',
    PRIMARY KEY (idUsuario, idGrupo),
    CONSTRAINT FK_ug_Usuarios FOREIGN KEY (idUsuario) REFERENCES Usuarios(idUsuario),
    CONSTRAINT FK_ug_Grupos FOREIGN KEY (idGrupo) REFERENCES Grupos(idGrupo)
);

CREATE TABLE usuario_plataforma(
	idUsuario4 BIGINT NOT NULL,
	idPlataforma1 BIGINT NOT NULL,
	rolUsuarioPlataforma NVARCHAR(50) DEFAULT 'Miembro',
	fechaUnion DATETIME2 DEFAULT SYSDATETIME(),
	estadoMiembro NVARCHAR(20) DEFAULT 'Activo',
	PRIMARY KEY (idUsuario4, idPlataforma1),
	CONSTRAINT FK_usuario_plataforma_Usuarios FOREIGN KEY (idUsuario4) REFERENCES Usuarios(idUsuario),
	CONSTRAINT FK_usuario_plataforma_Plataforma FOREIGN KEY (idPlataforma1) REFERENCES Plataforma(idPlataforma)
	);

/* --------------- Plataforma General ----------------- */
CREATE TABLE plataforma_publicacion(
	idPlataforma2 BIGINT NOT NULL,
	idPublicacion2 BIGINT NOT NULL,
	fechaCreacion DATETIME2 DEFAULT SYSDATETIME(),
	PRIMARY KEY (idPlataforma2, idPublicacion2),
	CONSTRAINT FK_plataforma_publicacion_Plataforma FOREIGN KEY (idPlataforma2) REFERENCES Plataforma(idPlataforma),
	CONSTRAINT FK_plataforma_publicacion_Publicaciones FOREIGN KEY (idPublicacion2) REFERENCES Publicaciones(idPublicacion)
);

CREATE TABLE plantilla_componentes(
	idComponente1 BIGINT NOT NULL,
	idPlantilla1 BIGINT NOT NULL,
	fechaCreacion DATETIME2 DEFAULT SYSDATETIME(),
	PRIMARY KEY (idComponente1, idPlantilla1),
	CONSTRAINT FK_plantilla_componentes_Componentes FOREIGN KEY (idComponente1) REFERENCES Componentes(id_componente),
	CONSTRAINT FK_plantilla_componentes_Plantillas FOREIGN KEY (idPlantilla1) REFERENCES Plantillas(idPlantilla)
);

/*
CREATE TABLE componentes_almacenamiento(
	idComponente2 INT,
	idAlmacenamiento1 INT,
)

CREATE TABLE plataforma_sistema(
	idPlataforma3 INT,
	idSistema1 INT,
)

CREATE TABLE almacenamiento_sistema(
	idAlmacenamiento2 INT,
	idSistema2 INT,
)
*/

/* --------------------------- FIN TABLAS INTERMEDIAS --------------------------------*/

/* -------------------- INICIO DE SELECT - INNER JOIN - PROCESOS -------------------- */

-- Tablas adicionales para el sistema de Chat con IA

-- Tabla para las conversaciones/proyectos de generación
CREATE TABLE Conversaciones (
    idConversacion BIGINT IDENTITY(1,1) PRIMARY KEY,
    idUsuario BIGINT NOT NULL,
    tituloProyecto NVARCHAR(200) NULL,
    descripcionInicial NVARCHAR(MAX) NULL,
    estadoConversacion NVARCHAR(50) NOT NULL DEFAULT 'En Progreso', -- 'En Progreso', 'Generando', 'Completada', 'Cancelada'
    porcentajeProgreso INT DEFAULT 0,
    fechaCreacion DATETIME2 DEFAULT SYSDATETIME(),
    fechaUltimaModificacion DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Conversaciones_Usuarios FOREIGN KEY (idUsuario) REFERENCES Usuarios(idUsuario)
);

-- Tabla para los mensajes del chat (usuario e IA)
CREATE TABLE MensajesChat (
    idMensajeChat BIGINT IDENTITY(1,1) PRIMARY KEY,
    idConversacion BIGINT NOT NULL,
    tipoMensaje NVARCHAR(20) NOT NULL, -- 'Usuario', 'IA', 'Sistema'
    contenidoMensaje NVARCHAR(MAX) NOT NULL,
    metadatos NVARCHAR(MAX) NULL, -- JSON con información adicional
    fechaCreacion DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_MensajesChat_Conversaciones FOREIGN KEY (idConversacion) REFERENCES Conversaciones(idConversacion)
);

-- Tabla para almacenar los proyectos generados
CREATE TABLE ProyectosGenerados (
    idProyecto BIGINT IDENTITY(1,1) PRIMARY KEY,
    idConversacion BIGINT NOT NULL,
    idUsuario BIGINT NOT NULL,
    nombreProyecto NVARCHAR(200) NOT NULL,
    descripcionProyecto NVARCHAR(MAX) NULL,
    tipoPlataforma NVARCHAR(100) NULL, -- 'E-commerce', 'Blog', 'Portfolio', etc.
    configuracionJSON NVARCHAR(MAX) NULL, -- Configuración completa del proyecto
    estadoProyecto NVARCHAR(50) NOT NULL DEFAULT 'Borrador', -- 'Borrador', 'Generado', 'Publicado'
    fechaCreacion DATETIME2 DEFAULT SYSDATETIME(),
    fechaUltimaModificacion DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_ProyectosGenerados_Conversaciones FOREIGN KEY (idConversacion) REFERENCES Conversaciones(idConversacion),
    CONSTRAINT FK_ProyectosGenerados_Usuarios FOREIGN KEY (idUsuario) REFERENCES Usuarios(idUsuario)
);