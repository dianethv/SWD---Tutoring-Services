const { getPool } = require('./data/database');

async function testConnection() {
  const pool = getPool();
  try {
    const [rows] = await pool.query('SELECT NOW() AS connected_at');
    console.log('Database connected:', rows[0]);
  } catch (error) {
    console.error('Connection failed:', error.message);
  } finally {
    await pool.end();
    process.exit();
  }
}

testConnection();
