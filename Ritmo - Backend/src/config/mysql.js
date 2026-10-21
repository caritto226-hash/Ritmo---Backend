const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // DATE llega como "YYYY-MM-DD" y DATETIME como "YYYY-MM-DD HH:mm:ss", tal como están guardados.
  // Así no se corre la hora (09:00 ya no se muestra como 14:00) ni el día.
  dateStrings: true,
});

async function connectMySQL() {
  await pool.query('SELECT 1');
  return true;
}

module.exports = {
  pool,
  connectMySQL,
};