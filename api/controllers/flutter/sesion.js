// Conexion a MySQL Server
const { poolPromise, sql } = require('../../db');
const bcrypt = require('bcrypt');
const multer = require("multer")

const storage = multer.memoryStorage();
const upload = multer({ storage: multer.memoryStorage() });


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
      tipoUsuario = 'Usuario',
      foto_perfil = null,
      biografia = null
    } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);

    const pool = await poolPromise;
    await pool.request()
      .input('nombre', sql.NVarChar, nombre)
      .input('apellido', sql.NVarChar, apellido)
      .input('correoElectronico', sql.NVarChar, correoElectronico)
      .input('contrasena', sql.NVarChar, hashedPassword)
      .input('telefono', sql.NVarChar, telefono)
      .input('tipoUsuario', sql.NVarChar, tipoUsuario)
      .input('foto_perfil', sql.VarBinary, foto_perfil)
      .input('biografia', sql.NVarChar, biografia)
      .query(`INSERT INTO Usuarios 
        (nombre, apellido, correoElectronico, contrasena, telefono, tipoUsuario, foto_perfil, biografia)
        VALUES (@nombre, @apellido, @correoElectronico, @contrasena, @telefono, @tipoUsuario, @foto_perfil, @biografia)`);

    res.status(201).json({
      ok: true,
      mensaje: 'Usuario insertado en la bd',
      data: req.body,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al insertar usuario',
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

module.exports = {
  registro,
  login,
  actualizarPerfilImg,
  actualizarPerfil,
  explorar,
  explorarActivas
};
