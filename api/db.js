//Dependencias
const sql = require('mssql');

// CONFIGURA ESTO CON SUS USUARIO Y BD DE SMARTSYS
// SA ROOT DEFAULT DE MYSQL SERVER
const config = {
  user: 'sa',
  password: 'root',
<<<<<<< HEAD
  server: '192.168.1.6', // o tu IP local, ej. '192.168.1.100'
=======
  server: '192.168.56.1', // o tu IP local, ej. '192.168.1.100'
>>>>>>> 06edfebb8a25cc55f7c5055029cc1a0e290d5e6a
  database: 'SmartSys',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Conectado a SQL Server');
    return pool;
  })
  .catch(err => console.log('Error de conexión:', err));

module.exports = {
  sql,
  poolPromise
};