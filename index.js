// index.js

const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const PORT = process.env.PORT || 3000;

// --- MySQL Connection Pool Setup ---
const dbPool = mysql.createPool({
    host: 'localhost', // Your MySQL host
    user: 'root', // Your MySQL username
    password: '777@Ashir', // Your MySQL password
    database: 'routed_admin_db', // The database name you'll use
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the database connection
dbPool.getConnection()
    .then(connection => {
        console.log('Successfully connected to MySQL database!');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to MySQL database:', err);
        process.exit(1); // Exit if DB connection fails, as it's critical
    });

// Make dbPool globally available to request handlers via app.locals
app.locals.dbPool = dbPool;

// Middleware to parse JSON bodies
app.use(express.json());

// Basic route for the root URL
app.get('/', (req, res) => {
    res.send('Welcome to the Routed Admin API Backend!');
});

// --- API Routes Definition ---
// Import controller/router modules
const routesRouter = require('./controllers/routesController'); // routesController will now export a router
const assignmentsRouter = require('./controllers/assignmentsController');
const driversRouter = require('./controllers/driversController');
const trackingRouter = require('./controllers/trackingController');
const violationsRouter = require('./controllers/violationsController');
const profileRouter = require('./controllers/profileController');


// Use the routers for specific base paths
app.use('/routes', routesRouter);
app.use('/assignments', assignmentsRouter);
app.use('/drivers', driversRouter);
app.use('/tracking', trackingRouter);
app.use('/violations', violationsRouter);
app.use('/admin/profile', profileRouter); // Note: /admin/profile is a direct path

// --- End API Routes Definition ---


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Press CTRL+C to stop the server');
});