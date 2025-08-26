//Dependencias
const sql = require('mssql');

// Configuración simple con SA habilitado
const config = {
  user: 'sa',
  password: 'root',
  server: 'localhost',
  database: 'SmartSys',
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

console.log('🔄 Conectando con SA habilitado...');

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('✅ ¡CONEXIÓN EXITOSA con SA!');
    return pool;
  })
  .catch(err => {
    console.log('❌ Error:', err.message);
    return null;
  });

module.exports = {
  sql,
  poolPromise
};