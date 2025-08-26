// Conexion a MySQL Server
const { poolPromise, sql } = require('../../db');
const bcrypt = require('bcrypt');
const multer = require("multer")

const storage = multer.memoryStorage();
const upload = multer({ storage: multer.memoryStorage() });
const crypto = require("crypto");

//<------- Inicio Codigo unico chat -------->
function generarCodigoUnico(nombre, apellido) {
  let iniciales = "";
  if (nombre && nombre.length > 0) iniciales += nombre[0];
  if (apellido && apellido.length > 0) iniciales += apellido[0];
  iniciales = iniciales.toUpperCase();

  // Generar 2 bytes aleatorios en HEX (ej: 3F7C)
  const randomBytes = crypto.randomBytes(2).toString("hex").toUpperCase();

  return iniciales + randomBytes; // Ejemplo: ER3F7C
}
//<------- Fin Codigo unico chat -------->
// <---------- inicio login -------------->
async function login(req, res) {
  try {
    const { correoElectronico, contrasena } = req.body;

    const pool = await poolPromise;
    const consulta = await pool.request()
      .input('correoElectronico', sql.NVarChar, correoElectronico)
      .query(`SELECT idUsuario, nombre, apellido, correoElectronico, contrasena, telefono, tipoUsuario, estadoCuenta, fechaCreacion, foto_perfil, biografia 
              FROM Usuarios 
              WHERE correoElectronico = @correoElectronico`);

    if (consulta.recordset.length === 0) {
      return res.status(401).json({
        ok: false,
        mensaje: 'Usuario no encontrado',
      });
    } else {
      const usuario = consulta.recordset[0];
      const passwordMatch = await bcrypt.compare(contrasena, usuario.contrasena);
      if (!passwordMatch) {
        res.status(401).json({
          ok: false,
          mensaje: 'Contraseña incorrecta',
        });
      } else {
        res.status(200).json({
          ok: true,
          mensaje: 'Login exitoso',
          data: {
            idUsuario: usuario.idUsuario,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correoElectronico: usuario.correoElectronico,
            telefono: usuario.telefono,
            tipoUsuario: usuario.tipoUsuario,
            estadoCuenta: usuario.estadoCuenta,
            fechaCreacion: usuario.fechaCreacion,
            foto_perfil: usuario.foto_perfil,
            biografia: usuario.biografia
          }
        });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al iniciar sesión',
    });
  }
}
// <---------- fin login -------------->

// <---------- inicio registro -------->
async function registro(req, res) {
  try {
    const {
      nombre,
      apellido,
      correoElectronico,
      contrasena,
      telefono = null,
      tipoUsuario = "Usuario",
      foto_perfil = null,
      biografia = null
    } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);

    // ✅ Generar CodigoUnico
    const codigoUnico = generarCodigoUnico(nombre, apellido);

    const pool = await poolPromise;
    await pool.request()
      .input("nombre", sql.NVarChar, nombre)
      .input("apellido", sql.NVarChar, apellido)
      .input("correoElectronico", sql.NVarChar, correoElectronico)
      .input("contrasena", sql.NVarChar, hashedPassword)
      .input("telefono", sql.NVarChar, telefono)
      .input("tipoUsuario", sql.NVarChar, tipoUsuario)
      .input("foto_perfil", sql.VarBinary, foto_perfil)
      .input("biografia", sql.NVarChar, biografia)
      .input("codigoUnico", sql.NVarChar, codigoUnico) // << agregado
      .query(`INSERT INTO Usuarios 
        (nombre, apellido, correoElectronico, contrasena, telefono, tipoUsuario, foto_perfil, biografia, codigoUnico)
        VALUES (@nombre, @apellido, @correoElectronico, @contrasena, @telefono, @tipoUsuario, @foto_perfil, @biografia, @codigoUnico)`);

    res.status(201).json({
      ok: true,
      mensaje: "Usuario insertado en la bd",
      data: {
        nombre,
        apellido,
        correoElectronico,
        telefono,
        tipoUsuario,
        biografia,
        codigoUnico // ✅ devolvemos el código único generado
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al insertar usuario",
    });
  }
}
// <---------- fin registro -------->
// <---------- inicio actualizar perfil imagen -------->//
async function actualizarPerfilImg(req, res) {
  try {
    const { idUsuario } = req.body;
    let foto_perfil = null;

    if (req.file) {
      foto_perfil = req.file.buffer; // Los bytes correctos de la imagen
    }

    const pool = await poolPromise;

    if (req.file) {
      // Solo actualiza la foto si hay archivo
      await pool.request()
        .input('idUsuario', sql.BigInt, idUsuario)
        .input('foto_perfil', sql.VarBinary, req.file.buffer)
        .query(`
      UPDATE Usuarios SET 
        foto_perfil = @foto_perfil
      WHERE idUsuario = @idUsuario
    `);
    }


    const consulta = await pool.request()
      .input('idUsuario', sql.BigInt, idUsuario)
      .query(`
        SELECT idUsuario, nombre, apellido, correoElectronico, telefono, tipoUsuario, estadoCuenta, fechaCreacion, foto_perfil, biografia 
        FROM Usuarios WHERE idUsuario = @idUsuario
      `);

    res.status(200).json({
      ok: true,
      message: 'Perfil con foto actualizado exitosamente',
      data: consulta.recordset[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: 'Error al actualizar perfil con foto'
    });
  }
}

// <---------- FIN actualizar perfil imagen -------->//
// <---------- inicio actualizar perfil -------->
async function actualizarPerfil(req, res) {
  try {
    const { idUsuario, nombre, apellido, telefono, biografia } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input('idUsuario', sql.BigInt, idUsuario)
      .input('nombre', sql.NVarChar, nombre)
      .input('apellido', sql.NVarChar, apellido)
      .input('telefono', sql.NVarChar, telefono)
      .input('biografia', sql.NVarChar, biografia)
      .query(`UPDATE Usuarios SET 
                nombre = @nombre, 
                apellido = @apellido, 
                telefono = @telefono, 
                biografia = @biografia 
              WHERE idUsuario = @idUsuario`);

    // Consulta el usuario actualizado
    const consulta = await pool.request()
      .input('idUsuario', sql.BigInt, idUsuario)
      .query(`SELECT idUsuario, nombre, apellido, correoElectronico, telefono, tipoUsuario, estadoCuenta, fechaCreacion, foto_perfil, biografia 
              FROM Usuarios WHERE idUsuario = @idUsuario`);

    const usuarioActualizado = consulta.recordset[0];

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: usuarioActualizado
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando perfil'
    });
  }
}
// <---------- fin actualizar perfil -------->//
// <---------- inicio explorar plataformas ---------->

// Función para explorar plataformas con búsqueda
async function explorar(req, res) {
  try {
    console.log('Endpoint explorar llamado con query:', req.query);

    const { busqueda = "" } = req.query;
    const pool = await poolPromise;

    // Log para debug
    console.log('Buscando plataformas con término:', busqueda);

    // Consulta SQL con LIKE y filtros
    const consulta = await pool.request()
      .input("busqueda", sql.NVarChar, `%${busqueda}%`)
      .query(`
        SELECT 
          idPlataforma, 
          nombrePlataforma, 
          descripcionPlataforma, 
          privacidadPlataforma, 
          estadoPlataforma, 
          capacidadMiembros_plataforma, 
          codigoPlataforma, 
          iconoPlataforma, 
          fondoPlataforma,
          fechaCreacion
        FROM Plataforma
        WHERE privacidadPlataforma IN ('Público','Privado','Public','Private')
          AND (nombrePlataforma LIKE @busqueda OR descripcionPlataforma LIKE @busqueda)
        ORDER BY fechaCreacion DESC
      `);

    console.log('Resultados encontrados:', consulta.recordset.length);

    res.status(200).json({
      ok: true,
      mensaje: "Plataformas encontradas",
      data: consulta.recordset,
      totalResultados: consulta.recordset.length
    });

  } catch (error) {
    console.error('Error en explorar:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al buscar plataformas",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Función para obtener plataformas activas
async function explorarActivas(req, res) {
  try {
    console.log('Endpoint explorarActivas llamado');

    const pool = await poolPromise;

    const consulta = await pool.request()
      .query(`
        SELECT 
          idPlataforma, 
          nombrePlataforma, 
          descripcionPlataforma, 
          privacidadPlataforma, 
          estadoPlataforma, 
          capacidadMiembros_plataforma, 
          codigoPlataforma, 
          iconoPlataforma, 
          fondoPlataforma,
          fechaCreacion
        FROM Plataforma
        WHERE estadoPlataforma = 'Activo'
        ORDER BY fechaCreacion DESC
      `);

    console.log('Plataformas activas encontradas:', consulta.recordset.length);

    res.status(200).json({
      ok: true,
      mensaje: "Plataformas activas encontradas",
      data: consulta.recordset,
      totalResultados: consulta.recordset.length
    });

  } catch (error) {
    console.error('Error en explorarActivas:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al obtener plataformas activas",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
// <---------- fin explorar plataformas ---------->
// <---------- inicio unirse a plataforma ---------->

async function unirsePublico(req, res) {
  try {
    const { idUsuario, idPlataforma } = req.body;

    if (!idUsuario || !idPlataforma) {
      return res.status(400).json({
        ok: false,
        mensaje: "Faltan datos (idUsuario o idPlataforma)."
      });
    }

    const pool = await poolPromise;

    // Verificar si ya está unido
    const existe = await pool.request()
      .input('idUsuario', sql.BigInt, idUsuario)
      .input('idPlataforma', sql.BigInt, idPlataforma)
      .query(`
        SELECT * FROM usuario_plataforma 
        WHERE idUsuario4 = @idUsuario AND idPlataforma1 = @idPlataforma
      `);

    if (existe.recordset.length > 0) {
      return res.status(200).json({
        ok: true,
        mensaje: "El usuario ya está unido a esta plataforma"
      });
    }

    // Insertar nueva relación
    await pool.request()
      .input('idUsuario', sql.BigInt, idUsuario)
      .input('idPlataforma', sql.BigInt, idPlataforma)
      .input('rolUsuarioPlataforma', sql.NVarChar, "Miembro")
      .query(`
        INSERT INTO usuario_plataforma (idUsuario4, idPlataforma1, rolUsuarioPlataforma) 
        VALUES (@idUsuario, @idPlataforma, @rolUsuarioPlataforma)
      `);

    res.status(201).json({
      ok: true,
      mensaje: "Unido a la plataforma (pública) correctamente"
    });

  } catch (error) {
    console.error("Error en unirsePublico:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al unirse a la plataforma pública"
    });
  }
}

async function unirsePrivado(req, res) {
  try {
    const { idUsuario, idPlataforma, codigo } = req.body;

    if (!idUsuario || !idPlataforma || !codigo) {
      return res.status(400).json({
        ok: false,
        mensaje: "Faltan datos (idUsuario, idPlataforma o código)."
      });
    }

    const pool = await poolPromise;

    // Buscar plataforma
    const plataforma = await pool.request()
      .input('idPlataforma', sql.BigInt, idPlataforma)
      .query(`SELECT * FROM Plataforma WHERE idPlataforma = @idPlataforma`);

    if (plataforma.recordset.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Plataforma no encontrada"
      });
    }

    const datosPlataforma = plataforma.recordset[0];

    // Validar código
    if (datosPlataforma.codigoPlataforma !== codigo) {
      return res.status(401).json({
        ok: false,
        mensaje: "Código incorrecto"
      });
    }

    // Verificar si ya está unido
    const existe = await pool.request()
      .input('idUsuario', sql.BigInt, idUsuario)
      .input('idPlataforma', sql.BigInt, idPlataforma)
      .query(`
        SELECT * FROM usuario_plataforma 
        WHERE idUsuario4 = @idUsuario AND idPlataforma1 = @idPlataforma
      `);

    if (existe.recordset.length > 0) {
      return res.status(200).json({
        ok: true,
        mensaje: "El usuario ya está unido a esta plataforma"
      });
    }

    // Insertar nueva relación
    await pool.request()
      .input('idUsuario', sql.BigInt, idUsuario)
      .input('idPlataforma', sql.BigInt, idPlataforma)
      .input('rolUsuarioPlataforma', sql.NVarChar, "Miembro")
      .query(`
        INSERT INTO usuario_plataforma (idUsuario4, idPlataforma1, rolUsuarioPlataforma) 
        VALUES (@idUsuario, @idPlataforma, @rolUsuarioPlataforma)
      `);

    res.status(201).json({
      ok: true,
      mensaje: "Unido a la plataforma (privada) correctamente"
    });

  } catch (error) {
    console.error("Error en unirsePrivado:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al unirse a la plataforma privada"
    });
  }
}

// <---------- inicio mis Plataformas con búsqueda ---------->
async function misPlataformas(req, res) {
  try {
    const { idUsuario, busqueda = "" } = req.query; 
    if (!idUsuario) {
      return res.status(400).json({
        ok: false,
        mensaje: "Se requiere el ID del usuario"
      });
    }

    const pool = await poolPromise;

    const consulta = await pool.request()
      .input('idUsuario', sql.BigInt, idUsuario)
      .input('busqueda', sql.NVarChar, `%${busqueda}%`)
      .query(`
        SELECT 
          p.idPlataforma,
          p.nombrePlataforma,
          p.descripcionPlataforma,
          p.privacidadPlataforma,
          p.estadoPlataforma,
          p.capacidadMiembros_plataforma,
          p.codigoPlataforma,
          p.iconoPlataforma,
          p.fondoPlataforma,
          p.fechaCreacion,
          up.rolUsuarioPlataforma,
          up.fechaUnion
        FROM usuario_plataforma up
        INNER JOIN Plataforma p ON up.idPlataforma1 = p.idPlataforma
        WHERE up.idUsuario4 = @idUsuario
          AND (p.nombrePlataforma LIKE @busqueda OR p.descripcionPlataforma LIKE @busqueda)
        ORDER BY up.fechaUnion DESC
      `);

    console.log('Plataformas del usuario encontradas:', consulta.recordset.length);

    res.status(200).json({
      ok: true,
      mensaje: "Plataformas del usuario obtenidas exitosamente",
      data: consulta.recordset,
      totalPlataformas: consulta.recordset.length
    });

  } catch (error) {
    console.error('Error en misPlataformas:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al obtener las plataformas del usuario",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
// <---------- fin mis Plataformas con búsqueda ---------->
// <---------- inicio publicaciones ---------->

// Listado de publicaciones por plataforma
async function publicacionesPorPlataforma(req, res) {
  try {
    const idPlataforma = Number(req.params.idPlataforma);

    if (!idPlataforma || isNaN(idPlataforma)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El id de plataforma no es válido"
      });
    }

    console.log('Buscando publicaciones para la plataforma ID:', idPlataforma);

    const pool = await poolPromise;

    const consulta = await pool.request()
      .input('idPlataforma', sql.BigInt, idPlataforma)
      .query(`
        SELECT pub.*
        FROM Publicaciones pub
        INNER JOIN plataforma_publicacion rel
          ON pub.idPublicacion = rel.idPublicacion2
        WHERE rel.idPlataforma2 = @idPlataforma
          AND pub.estado = 'Activo'
      `);

    console.log('Publicaciones encontradas:', consulta.recordset.length);

    res.status(200).json({
      ok: true,
      mensaje: "Publicaciones encontradas",
      data: consulta.recordset,
      total: consulta.recordset.length
    });

  } catch (error) {
    console.error("Error en publicacionesPorPlataforma:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al obtener publicaciones por plataforma",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


// Ver detalles de una publicación
async function verPublicacion(req, res) {
  try {
    const { idPublicacion } = req.params;

    if (!idPublicacion) {
      return res.status(400).json({
        ok: false,
        mensaje: "Falta el id de la publicación"
      });
    }

    const pool = await poolPromise;
    const consulta = await pool.request()
      .input('idPublicacion', sql.BigInt, idPublicacion)
      .query(`SELECT * FROM Publicaciones WHERE idPublicacion = @idPublicacion`);

    if (consulta.recordset.length === 0) {
      return res.status(404).json({
        ok: false,
        mensaje: "Publicación no encontrada"
      });
    }

    res.status(200).json({
      ok: true,
      mensaje: "Publicación encontrada",
      data: consulta.recordset[0]
    });

  } catch (error) {
    console.error("Error en verPublicacion:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al obtener publicación"
    });
  }
}

// <---------- fin publicaciones ---------->
module.exports = {
  registro,
  login,
  actualizarPerfilImg,
  actualizarPerfil,
  explorar,
  explorarActivas,
  unirsePublico,
  unirsePrivado,
  misPlataformas,
  publicacionesPorPlataforma,
  verPublicacion
};
