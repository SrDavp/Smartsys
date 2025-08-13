// Conexion a MySQL Server
const { poolPromise, sql } = require('../../db');
const bcrypt = require('bcrypt');

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
// <---------- fin actualizar perfil -------->// ...agrega a module.exports...

module.exports = {
  registro,
  login,
  actualizarPerfil
};
