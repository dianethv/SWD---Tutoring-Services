require('dotenv').config();
const mysql = require('mysql2/promise');

let pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Get the active connection pool.
 * Routes should call getPool() inside request handlers (not at module load).
 */
function getPool() {
  return pool;
}

/**
 * Replace the active pool (used by tests to inject a mock).
 */
function setPool(p) {
  pool = p;
}

module.exports = { getPool, setPool };
