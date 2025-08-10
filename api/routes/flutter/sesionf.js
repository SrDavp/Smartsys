const express = require("express");

const sesion = require("../../controllers/flutter/sesion.js")
const router = express.Router()

router.post("/registro", sesion.registro)
router.post("/login", sesion.login)

module.exports = router