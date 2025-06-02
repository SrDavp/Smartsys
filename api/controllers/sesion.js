// Conexion a MySQL Server
const { poolPromise, sql } = require('../db');

function hola(req, res){
    console.log("hola")
}

async function registro(req, res) {
  try {
    // Recibir datos que manda Flutter en JSON
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Falta el nombre',
      });
    }

    const pool = await poolPromise;
    await pool.request()
      .input('nombre', sql.VarChar, nombre)
      .query('INSERT INTO usuario (nombre) VALUES (@nombre)');

    res.status(200).json({
      ok: true,
      mensaje: 'Usuario insertado correctamente',
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al insertar usuario',
    });
  }
}

module.exports = {
  registro,
  hola
};
