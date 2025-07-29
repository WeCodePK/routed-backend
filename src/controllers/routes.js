const express = require('express');
const router = express.Router();

const { resp, query } = require('../functions');

router.get('/', async (req, res) => {
    try {
        return resp(res, 200, 'Successfully fetched all routes.', {
            routes: await query(req, 'SELECT * FROM routes ORDER BY createdAt DESC')
        });
    }

    catch (error) {
        console.error('Error getting all routes:', error);
        return resp(res, 500, 'Internal Server Error');
    }
});

router.post('/', async (req, res) => {
    const { name, description, totalDistance, points } = req.body;

    if (!name || !description || !totalDistance || !points) return resp(res, 400, 'Missing or malformed input');

    try {
        const result = await query(req,
            'INSERT INTO routes (name, description, totalDistance, points, createdAt) VALUES (?, ?, ?, ?, NOW())',
            [name, description, totalDistance, points]
        );

        return resp(res, 200, "Route saved successfully", { route: { id: result.insertId } });
    }

    catch (error) {
        console.error('Error saving route:', error);
        return resp(res, 500, 'Internal Server Error');
    }
});

router.get('/:id', async (req, res) => {
    try {
        const rows = await query(req, 'SELECT * FROM routes WHERE id = ?', [req.params.id]);

        if (!rows.length) return resp(res, 404, 'No such route');
        return resp(res, 200, 'Successfully fetched route', { route: rows[0] });
    }

    catch (error) {
        console.error('Error getting route by ID:', error);
        return resp(res, 500, 'Internal Server Error');
    }
});

router.put('/:id', async (req, res) => {
    const routeId = req.params.id;
    const { name, description, totalDistance, points } = req.body;

    let sql = 'UPDATE routes SET ';
    const params = [];
    const fieldsToUpdate = [];

    if (name) {
        fieldsToUpdate.push('name = ?');
        params.push(name);
    }
    if (description) {
        fieldsToUpdate.push('description = ?');
        params.push(description);
    }
    if (totalDistance) {
        fieldsToUpdate.push('totalDistance = ?');
        params.push(totalDistance);
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
        const result = await query(req, sql, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Route not found or no changes made.' });
        }
        res.status(200).json({ message: 'Route updated successfully.' });
    } catch (error) {
        console.error('Error updating route:', error);
        res.status(500).json({ message: 'Error updating route', error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await query(req, 'DELETE FROM routes WHERE id = ?', [req.params.id]);
        return resp(res, 200, 'Successfully deleted route');
    }

    catch (error) {
        console.error('Error deleting route:', error);
        return resp(res, 500, 'Internal Server Error');
    }
});

module.exports = router;