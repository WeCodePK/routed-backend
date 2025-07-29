const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('[INFO] Connected to MySQL');

    const schemaPath = path.resolve(__dirname, '../schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    const queries = schemaSQL
      .split(/;\s*$/gm)
      .map(q => q.trim())
      .filter(Boolean);

    for (const query of queries) {
      await connection.query(query);
    }

    console.log('[INFO] MySQL schema initialized');
    connection.release();
  } catch (err) {
    console.error('[ERROR] Failed to initialize MySQL schema:', err);
    process.exit(1);
  }
}

initializeDatabase();
module.exports = pool;
