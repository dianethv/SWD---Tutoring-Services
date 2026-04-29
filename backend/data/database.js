const { loadEnv } = require('../loadEnv');
loadEnv('../.env');
const mysql = require('mysql2/promise');

function getDatabaseConfig() {
  if (process.env.DATABASE_URL) {
    const databaseUrl = new URL(process.env.DATABASE_URL);

    return {
      host: databaseUrl.hostname,
      port: Number(databaseUrl.port) || 3306,
      user: decodeURIComponent(databaseUrl.username),
      password: decodeURIComponent(databaseUrl.password),
      database: databaseUrl.pathname.replace(/^\//, ''),
    };
  }

  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };
}

let pool = mysql.createPool({
  ...getDatabaseConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

function getPool() {
  return pool;
}

function setPool(p) {
  pool = p;
}

module.exports = { getPool, setPool };
