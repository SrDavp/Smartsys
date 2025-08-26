const express = require("express");
const chat = require("../../controllers/flutter/chat.js");
const router = express.Router();

router.post("/nuevochat", chat.nuevochat);
router.get("/cargarchats/:idUsuario", chat.cargarchats);

// historial entre dos usuarios (sin idChat en la URL)
router.get("/chats/:idUsuario/:idReceptor", chat.cargarMensajes);

// enviar mensaje (POST)
router.post("/chats/enviar", chat.enviarMensaje);

module.exports = router;
