const express = require('express');
const router = express.Router();

const { resp, query } = require('../functions');

router.get('/', async (req, res) => {
    try {
        return resp(res, 200, 'Successfully fetched all drivers', {
            drivers: await query(req, 'SELECT * FROM drivers ORDER BY id DESC;')
        });
    }

    catch (error) {
        console.error('Error getting all drivers:', error);
        return resp(res, 500, 'Internal Server Error');
    }
});

router.post('/', async (req, res) => {
    const { name, phone } = req.body;

    if (!name || !phone) return resp(res, 400, 'Missing or malformed input');

    try {
        const result = await query(req,
            'INSERT INTO drivers (name, phone) VALUES (?, ?)',
            [name, phone]
        );

        return resp(res, 200, "Driver created successfully", { driver: { id: result.insertId } });
    }

    catch (error) {
        console.error('Error creating driver:', error);
        return resp(res, 500, 'Internal Server Error');
    }
});

router.get('/:id', async (req, res) => {
    try {
        const rows = await query(req, 'SELECT * FROM drivers WHERE id = ?', [req.params.id]);

        if (!rows.length) return resp(res, 404, 'No such driver');
        return resp(res, 200, 'Successfully fetched driver', { driver: rows[0] });
    }

    catch (error) {
        console.error('Error getting driver by ID:', error);
        return resp(res, 500, 'Internal Server Error');
    }
});

router.put('/:id', async (req, res) => {
    const { name, phone } = req.body;

    if (!name || !phone) return resp(res, 400, 'Missing or malformed input');

    try {
        const result = await query(req,
            'UPDATE drivers SET name = ?, phone = ? WHERE id = ?',
            [name, phone, req.params.id]
        );

        if (!result.affectedRows) return resp(res, 404, 'No such driver');
        return resp(res, 200, 'Successfully updated driver');
    }

    catch (error) {
        console.error('Error updating driver:', error);
        return resp(res, 500, 'Internal Server Error');
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await query(req, 'DELETE FROM drivers WHERE id = ?', [req.params.id]);
        return resp(res, 200, 'Successfully deleted driver');
    }

    catch (error) {
        console.error('Error deleting driver:', error);
        return resp(res, 500, 'Internal Server Error');
    }
});

module.exports = router;
