const express = require("express");

const Asp = require("../controllers/apiAsp.js")
const router = express.Router()

router.post("/api/recibir", Asp.DescOrg)

module.exports = router