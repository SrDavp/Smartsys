const express = require("express");

const Python = require("../controllers/apiPython.js")
const router = express.Router()

router.post("", Python.apiPython)

module.exports = router