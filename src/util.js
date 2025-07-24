function authMiddleware (req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access Denied: No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded; 
        next(); 
    }
    
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Access Denied: Token has expired.' });
        }

        console.error('JWT verification failed:', error.message);
        return res.status(403).json({ message: 'Access Denied: Invalid or expired token.' });
    }
}

async function executeQuery(req, sql, params = []) {
    const dbPool = req.app.locals.dbPool;
    let connection;
    try {
        connection = await dbPool.getConnection();
        const [rows, fields] = await connection.execute(sql, params);
        return rows;
    } finally {
        if (connection) connection.release();
    }
}

module.exports = {
    authMiddleware,
    executeQuery,
};