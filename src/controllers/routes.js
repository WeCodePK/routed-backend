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
    const { name, description, totalDistance, points } = req.body;

    if (!name || !description || !totalDistance || !points) return resp(res, 400, 'Missing or malformed input');

    try {
        const result = await query(req,
            'UPDATE routes SET name = ?, description = ?, totalDistance = ? points = ? WHERE id = ?',
            [name, description, totalDistance, points, req.params.id]
        );

        if (!result.affectedRows) return resp(res, 404, 'No such route');
        return resp(res, 200, 'Successfully updated route');
    }

    catch (error) {
        console.error('Error updating route:', error);
        return resp(res, 500, 'Internal Server Error');
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