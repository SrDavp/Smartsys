const express = require("express");

const sesion = require("../../controllers/flutter/sesion.js")
const router = express.Router()
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage });
//Rutas usuario
router.post("/registro", sesion.registro)
router.post("/login", sesion.login)
router.post("/actualizarPerfil", sesion.actualizarPerfil    )
router.post("/actualizarPerfilImg", upload.single('fotoPerfil'), sesion.actualizarPerfilImg)
//Rutas plataforma
router.get("/explorar", sesion.explorar); 
router.get("/explorarActivas", sesion.explorarActivas);
router.post("/unirsePublico", sesion.unirsePublico);
router.post("/unirsePrivado", sesion.unirsePrivado);
router.get("/misPlataformas", sesion.misPlataformas);
//Rutas publicaciones
router.get("/publicacionesPorPlataforma/:idPlataforma", sesion.publicacionesPorPlataforma);
router.get("/verPublicacion", sesion.verPublicacion);


router.post("/recuperar", sesion.recuperar);
router.post("/reset-password", sesion.resetpassword);

router.post("/users/google", sesion.google);


module.exports = router