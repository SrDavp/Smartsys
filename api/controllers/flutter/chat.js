const { poolPromise, sql } = require("../../db");

// Crea (si no existe) o devuelve el idChat entre dos usuarios (en cualquier orden)
async function getOrCreateChatId(pool, idA, idB) {
  const existing = await pool.request()
    .input("A", sql.BigInt, idA)
    .input("B", sql.BigInt, idB)
    .query(`
      SELECT TOP 1 idChat
      FROM ChatMsj
      WHERE (idUsuarioEmisor = @A AND idUsuarioReceptor = @B)
         OR (idUsuarioEmisor = @B AND idUsuarioReceptor = @A)
    `);

  if (existing.recordset.length > 0) {
    return existing.recordset[0].idChat;
  }

  // si no existe, crea cabecera y devuelve idChat
  const inserted = await pool.request()
    .input("A", sql.BigInt, idA)
    .input("B", sql.BigInt, idB)
    .query(`
      INSERT INTO ChatMsj (idUsuarioEmisor, idUsuarioReceptor)
      OUTPUT INSERTED.idChat
      VALUES (@A, @B)
    `);

  return inserted.recordset[0].idChat;
}

async function nuevochat(req, res) {
  try {
    const { idUsuario, codigoUnico } = req.body;
    const pool = await poolPromise;

    // buscar receptor por código
    const receptor = await pool.request()
      .input("codigoUnico", sql.NVarChar, codigoUnico)
      .query("SELECT idUsuario FROM Usuarios WHERE codigoUnico = @codigoUnico");

    if (receptor.recordset.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "No existe usuario con ese código único" });
    }

    const idUsuarioReceptor = receptor.recordset[0].idUsuario;

    // obtener o crear el chat
    const idChat = await getOrCreateChatId(pool, idUsuario, idUsuarioReceptor);

    return res.status(201).json({
      ok: true,
      mensaje: "Chat creado correctamente",
      data: {
        idChat,
        idUsuarioEmisor: idUsuario,
        idUsuarioReceptor: idUsuarioReceptor,
      }
    });
  } catch (error) {
    console.error("Error en nuevochat:", error);
    res.status(500).json({ ok: false, mensaje: "Error al crear chat" });
  }
}

async function cargarchats(req, res) {
  try {
    const { idUsuario } = req.params;
    if (!idUsuario) return res.status(400).json({ ok: false, mensaje: "Falta idUsuario" });

    const pool = await poolPromise;

    const result = await pool.request()
      .input("idUsuario", sql.BigInt, idUsuario)
      .query(`
        SELECT 
          cm.idChat,
          cm.idUsuarioEmisor,
          cm.idUsuarioReceptor,
          uEmisor.nombre AS nombreEmisor,
          uEmisor.foto_perfil AS fotoEmisor,
          uReceptor.nombre AS nombreReceptor,
          uReceptor.foto_perfil AS fotoReceptor,
          cm.mensaje AS ultimoMensaje,
          cm.fechamensaje,
          cm.totalMensajes
        FROM ChatMsj cm
        JOIN Usuarios uEmisor ON cm.idUsuarioEmisor = uEmisor.idUsuario
        JOIN Usuarios uReceptor ON cm.idUsuarioReceptor = uReceptor.idUsuario
        WHERE cm.idUsuarioEmisor = @idUsuario OR cm.idUsuarioReceptor = @idUsuario
        ORDER BY cm.fechamensaje DESC
      `);

    const chats = result.recordset.map(chat => {
      const isEmisor = String(chat.idUsuarioEmisor) === String(idUsuario);

      const fotoBuffer = isEmisor ? chat.fotoReceptor : chat.fotoEmisor;

      const fotoPerfil = fotoBuffer ? fotoBuffer.toString('base64') : null;

      return {
        idChat: chat.idChat,
        idUsuarioEmisor: chat.idUsuarioEmisor,
        idUsuarioReceptor: chat.idUsuarioReceptor,
        nombreUsuarioReceptor: isEmisor ? chat.nombreReceptor : chat.nombreEmisor,
        fotoPerfil, // ya es string o null
        ultimoMensaje: chat.ultimoMensaje || "",
        totalMensajes: chat.totalMensajes || 0,
        fechamensaje: chat.fechamensaje,
        tipo: "personal"
      };
    });

    res.status(200).json({ ok: true, mensaje: "Chats cargados correctamente", data: chats });
  } catch (error) {
    console.error("Error en cargarchats:", error);
    res.status(500).json({ ok: false, mensaje: "Error al cargar chats" });
  }
}

// --- Enviar mensaje ---
async function enviarMensaje(req, res) {
  try {
    const { idUsuarioEmisor, idUsuarioReceptor, mensaje } = req.body;
    console.log(req.body)

    if (!idUsuarioEmisor || !idUsuarioReceptor || !mensaje) {
      return res.status(400).json({ ok: false, mensaje: "Faltan datos para enviar mensaje" });
    }

    const pool = await poolPromise;

    // 1) obtener o crear idChat
    const idChat = await getOrCreateChatId(pool, idUsuarioEmisor, idUsuarioReceptor);

    // 2) insertar en historial
    const inserted = await pool.request()
      .input("idChat", sql.BigInt, idChat)
      .input("idUsuarioEmisor", sql.BigInt, idUsuarioEmisor)
      .input("idUsuarioReceptor", sql.BigInt, idUsuarioReceptor)
      .input("mensaje", sql.NVarChar, mensaje)
      .query(`
        INSERT INTO ChatMensajes (idChat, idUsuarioEmisor, idUsuarioReceptor, mensaje)
        OUTPUT INSERTED.idMensaje
        VALUES (@idChat, @idUsuarioEmisor, @idUsuarioReceptor, @mensaje)
      `);

    const idMensaje = inserted.recordset[0].idMensaje;

    // 3) actualizar cabecera
    await pool.request()
      .input("idChat", sql.BigInt, idChat)
      .input("mensaje", sql.NVarChar, mensaje)
      .query(`
        UPDATE ChatMsj
        SET mensaje = @mensaje,
            fechamensaje = SYSDATETIME(),
            totalMensajes = ISNULL(totalMensajes, 0) + 1
        WHERE idChat = @idChat
      `);

    res.status(201).json({
      ok: true,
      mensaje: "Mensaje enviado correctamente",
      data: { idChat, idMensaje }
    });

  } catch (error) {
    console.error("Error en enviarMensaje:", error);
    res.status(500).json({ ok: false, mensaje: "Error al enviar mensaje" });
  }
}

// --- Cargar historial entre dos usuarios (según tu ruta actual) ---
async function cargarMensajes(req, res) {
  try {
    const { idUsuario, idReceptor } = req.params;
    if (!idUsuario || !idReceptor) {
      return res.status(400).json({ ok: false, mensaje: "Falta idUsuario o idReceptor" });
    }

    const pool = await poolPromise;

    // 1) obtener idChat entre ambos (en cualquier dirección)
    const chat = await pool.request()
      .input("A", sql.BigInt, idUsuario)
      .input("B", sql.BigInt, idReceptor)
      .query(`
        SELECT TOP 1 idChat
        FROM ChatMsj
        WHERE (idUsuarioEmisor = @A AND idUsuarioReceptor = @B)
           OR (idUsuarioEmisor = @B AND idUsuarioReceptor = @A)
      `);

    if (chat.recordset.length === 0) {
      return res.status(200).json({ ok: true, mensaje: "Sin mensajes", data: [] });
    }

    const idChat = chat.recordset[0].idChat;

    // 2) traer historial
    const result = await pool.request()
      .input("idChat", sql.BigInt, idChat)
      .query(`
          SELECT 
            m.idMensaje,
            m.idUsuarioEmisor,
            m.idUsuarioReceptor,
            m.mensaje,
            m.fecha,
            u.foto_perfil AS fotoPerfil
          FROM ChatMensajes m
          JOIN Usuarios u ON m.idUsuarioEmisor = u.idUsuario
          WHERE m.idChat = @idChat
          ORDER BY m.fecha ASC
        `);

    const mensajes = result.recordset.map(m => ({
      idMensaje: m.idMensaje,
      idUsuarioEmisor: m.idUsuarioEmisor,
      idUsuarioReceptor: m.idUsuarioReceptor,
      mensaje: m.mensaje,
      fecha: m.fecha,
      fotoPerfil: m.fotoPerfil ? m.fotoPerfil.toString('base64') : null
    }));

    res.status(200).json({
      ok: true,
      mensaje: "Mensajes cargados correctamente",
      data: mensajes
    });

  } catch (error) {
    console.error("Error en cargarMensajes:", error);
    res.status(500).json({ ok: false, mensaje: "Error al cargar mensajes" });
  }
}

module.exports = {
  nuevochat,
  cargarchats,
  enviarMensaje,
  cargarMensajes
};
    