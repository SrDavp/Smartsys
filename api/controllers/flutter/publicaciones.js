// Conexion a MySQL Server
const { poolPromise, sql } = require('../../db');
const bcrypt = require('bcrypt');
const multer = require("multer")
const path = require('path');
const transporter = require('../../correo');

const storage = multer.memoryStorage();
const upload = multer({ storage: multer.memoryStorage() });
const crypto = require("crypto");

async function nuevaPublicacion(req, res) {
    try {
        const { idPlataforma, titulo, contenido, idUsuario } = req.body;
        const archivoAdjunto = req.file ? req.file.buffer : null;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('titulo', sql.NVarChar(200), titulo)
            .input('contenido', sql.NVarChar(sql.MAX), contenido)
            .input('archivoAdjunto', sql.VarBinary(sql.MAX), archivoAdjunto)
            .query(`
        INSERT INTO Publicaciones (titulo, contenido, fechaPublicacion, horaPublicacion, archivoAdjunto, estado)
        OUTPUT INSERTED.idPublicacion
        VALUES (@titulo, @contenido, CAST(GETDATE() AS DATE), CAST(GETDATE() AS TIME), @archivoAdjunto, 'Activo')
      `);

        const idPublicacion = result.recordset[0].idPublicacion;

        // Relaciones
        await pool.request()
            .input('idUsuario', sql.Int, idUsuario)
            .input('idPublicacion', sql.Int, idPublicacion)
            .query(`
        INSERT INTO usuario_publicaciones (idUsuario1, idPublicacion1)
        VALUES (@idUsuario, @idPublicacion)
      `);

        await pool.request()
            .input('idPlataforma', sql.Int, idPlataforma)
            .input('idPublicacion', sql.Int, idPublicacion)
            .query(`
        INSERT INTO plataforma_publicacion (idPlataforma2, idPublicacion2)
        VALUES (@idPlataforma, @idPublicacion)
      `);

        res.status(200).json({
            ok: true,
            msg: 'Publicación creada correctamente',
            data: {
                idPublicacion,
                titulo,
                contenido,
                estado: 'Activo',
                fechaPublicacion: new Date().toISOString(),
                archivoAdjunto: archivoAdjunto ? { data: archivoAdjunto } : null
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error al crear la publicación' });
    }
}

module.exports = {
    nuevaPublicacion
};
