const mysql = require('mysql2/promise');

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
  return true;
}

module.exports = {
  pool,
  testConnection,
};