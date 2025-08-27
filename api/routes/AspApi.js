const express = require("express");

const Asp = require("../controllers/apiAsp.js")
const router = express.Router()

router.post("/api/recibir", Asp.DescOrg)
router.post("/auth/restablecer/", Asp.restablecer)
router.post("/actualizarcontrasena", Asp.actualizarContrasena)
router.post("/actualizarcontrasenaperfil", Asp.actualizarcontrasenaperfil)

module.exports = router