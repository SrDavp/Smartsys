const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 3000;

// Rutas
const rutas = require('./routes/rutas');
const apiPython = require('./routes/PythonApi');
const aspapi = require('./routes/AspApi');

app.use('/', rutas);
app.use('/', apiPython);
app.use('/', aspapi);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API corriendo en http://localhost:${PORT}`);
});
