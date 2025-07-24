const fs = require('fs');
const mysql = require('mysql2/promise');

const dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function initializeDatabase() {
    try {
        const connection = await dbPool.getConnection();
        console.log('Successfully connected to MySQL database!');

        const schemaSQL = fs.readFileSync('/app/schema.sql', 'utf8');

        // Split by semicolon to support multiple statements
        const queries = schemaSQL
            .split(/;\s*$/m)
            .map(query => query.trim())
            .filter(query => query.length);

        for (const query of queries) {
            await connection.query(query);
        }

        console.log('Database schema initialized.');
        connection.release();
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initializeDatabase();

module.exports = dbPool;
