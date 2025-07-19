// controllers/assignmentsController.js

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

// POST /assignments
router.post('/', async (req, res) => {
    const { routeId, driverId } = req.body;
    if (!routeId || !driverId) {
        return res.status(400).json({ message: 'routeId and driverId are required.' });
    }

    try {
        // Optional: Check if routeId and driverId exist in their respective tables
        // For simplicity, we're skipping this check here, assuming FK constraints will handle it.

        const sql = 'INSERT INTO assignments (routeId, driverId) VALUES (?, ?)';
        const params = [routeId, driverId];
        const result = await executeQuery(req, sql, params);
        res.status(201).json({ id: result.insertId, routeId, driverId, message: 'Assignment created successfully.' });
    } catch (error) {
        console.error('Error creating assignment:', error);
        res.status(500).json({ message: 'Error creating assignment', error: error.message });
    }
});

module.exports = router;