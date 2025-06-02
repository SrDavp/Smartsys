const express = require("express");

const sesion = require("../controllers/sesion.js")
const router = express.Router()

router.post("/hola", sesion.registro)
router.get("/adios", sesion.hola)

module.exports = router