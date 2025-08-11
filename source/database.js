const fs = require('fs');
const mysql = require('mysql2/promise');

const pool = mysql.createPool(process.env.MYSQL_URL);

async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('[INFO] Connected to MySQL');

    const schemaSQL = fs.readFileSync('/app/db/schema.sql', 'utf8');

    const queries = schemaSQL.split(/;\s*$/gm).map(q => q.trim()).filter(Boolean);

    for (const query of queries) {
      await connection.query(query);
    }

    console.log('[INFO] MySQL schema initialized');
    connection.release();
  }

  catch (err) {
    console.error('[ERROR] Failed to initialize MySQL schema:', err);
    process.exit(1);
  }
}

initializeDatabase();
module.exports = pool;
