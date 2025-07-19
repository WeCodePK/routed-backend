// controllers/driversController.js

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

// GET /drivers
router.get('/', async (req, res) => {
    try {
        const sql = 'SELECT * FROM drivers';
        const result = await executeQuery(req, sql);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error getting all drivers:', error);
        res.status(500).json({ message: 'Error retrieving drivers', error: error.message });
    }
});

// POST /drivers
router.post('/', async (req, res) => {
    const { name, status } = req.body; // Status might be optional, default to 'available' in DB
    if (!name) {
        return res.status(400).json({ message: 'Driver name is required.' });
    }

    try {
        const sql = 'INSERT INTO drivers (name, status) VALUES (?, ?)';
        const params = [name, status || 'available']; // Use provided status or default
        const result = await executeQuery(req, sql, params);
        res.status(201).json({ id: result.insertId, name, status: status || 'available' });
    } catch (error) {
        console.error('Error creating driver:', error);
        res.status(500).json({ message: 'Error creating driver', error: error.message });
    }
});

// PUT /drivers/:id
router.put('/:id', async (req, res) => {
    const driverId = req.params.id;
    const { name, status } = req.body;

    if (!name && !status) {
        return res.status(400).json({ message: 'At least one field (name or status) is required for update.' });
    }

    let sql = 'UPDATE drivers SET ';
    const params = [];
    const fieldsToUpdate = [];

    if (name) {
        fieldsToUpdate.push('name = ?');
        params.push(name);
    }
    if (status) {
        fieldsToUpdate.push('status = ?');
        params.push(status);
    }

    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }

    sql += fieldsToUpdate.join(', ') + ' WHERE id = ?';
    params.push(driverId);

    try {
        const result = await executeQuery(req, sql, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Driver not found or no changes made.' });
        }
        res.status(200).json({ message: 'Driver updated successfully.' });
    } catch (error) {
        console.error('Error updating driver:', error);
        res.status(500).json({ message: 'Error updating driver', error: error.message });
    }
});

// DELETE /drivers/:id
router.delete('/:id', async (req, res) => {
    const driverId = req.params.id;
    try {
        const sql = 'DELETE FROM drivers WHERE id = ?';
        const params = [driverId];
        const result = await executeQuery(req, sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Driver not found.' });
        }
        res.status(200).json({ message: 'Driver deleted successfully.' });
    } catch (error) {
        console.error('Error deleting driver:', error);
        res.status(500).json({ message: 'Error deleting driver', error: error.message });
    }
});

module.exports = router;