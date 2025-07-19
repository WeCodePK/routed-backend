// controllers/routesController.js

const express = require('express');
const router = express.Router(); // Create a new router instance for this controller

// Helper function to execute a query (remains the same)
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

// Define the routes for /routes path using anonymous functions

// GET /routes
router.get('/', async (req, res) => {
    try {
        const sql = 'SELECT * FROM routes';
        const result = await executeQuery(req, sql);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error getting all routes:', error);
        res.status(500).json({ message: 'Error retrieving routes', error: error.message });
    }
});

// POST /routes
router.post('/', async (req, res) => {
    const { name, points } = req.body;
    if (!name || !points) {
        return res.status(400).json({ message: 'Name and points are required.' });
    }

    try {
        const sql = 'INSERT INTO routes (name, points) VALUES (?, ?)';
        const params = [name, JSON.stringify(points)];
        const result = await executeQuery(req, sql, params);
        res.status(201).json({ id: result.insertId, name, points });
    } catch (error) {
        console.error('Error creating route:', error);
        res.status(500).json({ message: 'Error creating route', error: error.message });
    }
});

// GET /routes/:id
router.get('/:id', async (req, res) => {
    const routeId = req.params.id;
    try {
        const sql = 'SELECT * FROM routes WHERE id = ?';
        const params = [routeId];
        const result = await executeQuery(req, sql, params);

        if (result.length === 0) {
            return res.status(404).json({ message: 'Route not found.' });
        }
        const route = result[0];
        route.points = JSON.parse(route.points);
        res.status(200).json(route);
    } catch (error) {
        console.error('Error getting route by ID:', error);
        res.status(500).json({ message: 'Error retrieving route', error: error.message });
    }
});

// PUT /routes/:id
router.put('/:id', async (req, res) => {
    const routeId = req.params.id;
    const { name, points } = req.body;

    if (!name && !points) {
        return res.status(400).json({ message: 'At least one field (name or points) is required for update.' });
    }

    let sql = 'UPDATE routes SET ';
    const params = [];
    const fieldsToUpdate = [];

    if (name) {
        fieldsToUpdate.push('name = ?');
        params.push(name);
    }
    if (points) {
        fieldsToUpdate.push('points = ?');
        params.push(JSON.stringify(points));
    }

    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }

    sql += fieldsToUpdate.join(', ') + ' WHERE id = ?';
    params.push(routeId);

    try {
        const result = await executeQuery(req, sql, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Route not found or no changes made.' });
        }
        res.status(200).json({ message: 'Route updated successfully.' });
    } catch (error) {
        console.error('Error updating route:', error);
        res.status(500).json({ message: 'Error updating route', error: error.message });
    }
});

// DELETE /routes/:id
router.delete('/:id', async (req, res) => {
    const routeId = req.params.id;
    try {
        const sql = 'DELETE FROM routes WHERE id = ?';
        const params = [routeId];
        const result = await executeQuery(req, sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Route not found.' });
        }
        res.status(200).json({ message: 'Route deleted successfully.' });
    } catch (error) {
        console.error('Error deleting route:', error);
        res.status(500).json({ message: 'Error deleting route', error: error.message });
    }
});

module.exports = router; // Export the router instance