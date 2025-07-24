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

dbPool.getConnection().then(connection => {
    console.log('Successfully connected to MySQL database!');
    connection.release();
}).catch(error => {
    console.error('Error connecting to MySQL database:', error);
    process.exit(1);
});

module.exports = dbPool;