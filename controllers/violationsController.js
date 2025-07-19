// controllers/violationsController.js

const express = require('express');
const router = express.Router();

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

// GET /violations
router.get('/', async (req, res) => {
    const { driverId, type, startTime, endTime } = req.query; // Example query parameters

    let sql = 'SELECT * FROM violations';
    const params = [];
    const conditions = [];

    if (driverId) {
        conditions.push('driverId = ?');
        params.push(driverId);
    }
    if (type) {
        conditions.push('type = ?');
        params.push(type);
    }
    if (startTime) {
        conditions.push('timestamp >= ?');
        params.push(startTime);
    }
    if (endTime) {
        conditions.push('timestamp <= ?');
        params.push(endTime);
    }

    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY timestamp DESC'; // Order by latest violation first

    try {
        const result = await executeQuery(req, sql, params);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error getting all violations:', error);
        res.status(500).json({ message: 'Error retrieving violations', error: error.message });
    }
});

// POST /violations (Assuming admins can manually add violations or an automated system reports them)
router.post('/', async (req, res) => {
    const { driverId, type, message } = req.body;
    if (!driverId || !type || !message) {
        return res.status(400).json({ message: 'driverId, type, and message are required for a violation.' });
    }

    try {
        const sql = 'INSERT INTO violations (driverId, type, message) VALUES (?, ?, ?)';
        const params = [driverId, type, message];
        const result = await executeQuery(req, sql, params);
        res.status(201).json({ id: result.insertId, driverId, type, message, timestamp: new Date() });
    } catch (error) {
        console.error('Error creating violation:', error);
        res.status(500).json({ message: 'Error creating violation', error: error.message });
    }
});


module.exports = router;