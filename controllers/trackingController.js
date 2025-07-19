// controllers/trackingController.js

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

// GET /tracking
router.get('/', async (req, res) => {
    const { driverId, startTime, endTime } = req.query; // Example query parameters

    let sql = 'SELECT * FROM tracking';
    const params = [];
    const conditions = [];

    if (driverId) {
        conditions.push('driverId = ?');
        params.push(driverId);
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
    sql += ' ORDER BY timestamp DESC'; // Order by latest tracking first

    try {
        const result = await executeQuery(req, sql, params);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error getting driver tracking data:', error);
        res.status(500).json({ message: 'Error retrieving tracking data', error: error.message });
    }
});

// POST /tracking (Assuming this endpoint is for a driver device updating its location)
// This wasn't explicitly in the Swagger UI for admin, but it's a logical place for it if admins can also submit tracking.
// If this is purely for admin *retrieval*, we can omit this POST.
// Let's include it for completeness as it's common for tracking to be submitted.
router.post('/', async (req, res) => {
    const { driverId, latitude, longitude, timestamp } = req.body;
    if (!driverId || !latitude || !longitude) {
        return res.status(400).json({ message: 'driverId, latitude, and longitude are required.' });
    }

    try {
        const sql = 'INSERT INTO tracking (driverId, latitude, longitude, timestamp) VALUES (?, ?, ?, ?)';
        const params = [driverId, latitude, longitude, timestamp || new Date()];
        const result = await executeQuery(req, sql, params);
        res.status(201).json({ id: result.insertId, driverId, latitude, longitude, timestamp: timestamp || new Date() });
    } catch (error) {
        console.error('Error recording tracking data:', error);
        res.status(500).json({ message: 'Error recording tracking data', error: error.message });
    }
});


module.exports = router;