// Conexion a MySQL Server
const { poolPromise, sql } = require('../../db');
const bcrypt = require('bcrypt');

// <---------- inicio login -------------->
async function login(req, res) {

  try {
    const { correoElectronico, contrasena } = req.body;

    const pool = await poolPromise;
    const consulta = await pool.request()
      .input('correoElectronico', sql.VarChar, correoElectronico)
      .query(`SELECT idUsuario, nombre, apellido, correoElectronico, contrasena 
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
                correoElectronico: usuario.correoElectronico
              }
            });
        }
    }
  } catch (error) {
      console.error(error);
      res.status(500).json({
        ok: false,
        mensaje: 'Error al insertar usuario',
      });
  }
}
// <---------- fin login -------------->

// <---------- inicio registro -------->
async function registro(req, res) {
  try {

    const { nombre, apellido, correoElectronico, contrasena } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);

    const pool = await poolPromise;
    await pool.request()
      .input('nombre', sql.VarChar, nombre)
      .input('apellido', sql.VarChar, apellido)
      .input('correoElectronico', sql.VarChar, correoElectronico)
      .input('contrasena', sql.VarChar, hashedPassword)
      .query(`INSERT INTO Usuarios (nombre, apellido, correoElectronico, contrasena)
              VALUES (@nombre, @apellido, @correoElectronico, @contrasena)`);

    if (pool.request()) {
      console.log("hola")
    }

    console.log(req.body)
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

module.exports = {
  registro,
  login
};
