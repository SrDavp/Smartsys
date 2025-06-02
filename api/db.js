//Dependencias
const sql = require('mssql');

// CONFIGURA ESTO CON SUS USUARIO Y BD DE SMARTSYS
// SA ROOT DEFAULT DE MYSQL SERVER
const config = {
  user: 'sa',
  password: 'root',
  server: '192.168.56.1', // o tu IP local, ej. '192.168.1.100'
  database: 'pruebanode',
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