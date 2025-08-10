const express = require("express");

const Python = require("../../controllers/python/apiPython.js")
const router = express.Router()

router.post("", Python.apiPython)

module.exports = router