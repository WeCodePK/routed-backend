require('dotenv').config(); 

const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken'); 
const bcrypt = require('bcrypt'); 
const app = express();
const PORT = process.env.PORT || 3000; 


const dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

dbPool.getConnection()
    .then(connection => {
        console.log('Successfully connected to MySQL database!');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to MySQL database:', err);
        process.exit(1);
    });

app.locals.dbPool = dbPool;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Welcome to the Routed Admin API Backend!');
});

app.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const sql = 'SELECT id, email, password_hash FROM admin_profiles WHERE email = ?';
        const [rows] = await dbPool.execute(sql, [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const admin = rows[0];
        const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { id: admin.id, email: admin.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } 
        );

        res.status(200).json({ message: 'Login successful', token });

    } catch (error) {
        console.error('Error during admin login:', error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
});

const authMiddleware = (req, res, next) => {
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
        
        return res.status(401).json({ message: 'Access Denied: No token provided.' });
    }

    try {
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded; 
        next(); 
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Access Denied: Token has expired.' });
        }
        console.error('JWT verification failed:', error.message);
        return res.status(403).json({ message: 'Access Denied: Invalid or expired token.' });
    }
};

const routesRouter = require('./controllers/routesController');
const assignmentsRouter = require('./controllers/assignmentsController');
const driversRouter = require('./controllers/driversController');
const trackingRouter = require('./controllers/trackingController');
const violationsRouter = require('./controllers/violationsController');
const profileRouter = require('./controllers/profileController');


app.use('/routes', authMiddleware, routesRouter);
app.use('/assignments', authMiddleware, assignmentsRouter);
app.use('/drivers', authMiddleware, driversRouter);
app.use('/tracking', authMiddleware, trackingRouter);
app.use('/violations', authMiddleware, violationsRouter);
app.use('/admin/profile', authMiddleware, profileRouter);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Press CTRL+C to stop the server');
});