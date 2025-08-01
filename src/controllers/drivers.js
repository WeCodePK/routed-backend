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
    const { name, phone, isLive } = req.body;
    if (!name || !phone) return resp(res, 400, 'Missing or malformed input');
    
    try {
        const existing = await query(req, 'SELECT COUNT(*) AS count FROM drivers WHERE phone = ?', [phone]);
        if (existing[0].count > 0) {
            return resp(res, 400, 'Phone number already exists');
        }

        const liveStatus = typeof isLive !== 'undefined' ? (isLive ? 1 : 0) : 1;

        const result = await query(req,
            'INSERT INTO drivers (name, phone, isLive) VALUES (?, ?, ?)',
            [name, phone, liveStatus]
        );
        return resp(res, 201, "Driver created successfully", { driver: { id: result.insertId } });
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
    const { name, phone, isLive } = req.body;

    const fieldsToUpdate = [];
    const params = [];
    
    if (name) {
        fieldsToUpdate.push('name = ?');
        params.push(name);
    }
    if (phone) {
        try {
            const existing = await query(req, 'SELECT COUNT(*) AS count FROM drivers WHERE phone = ? AND id != ?', [phone, req.params.id]);
            if (existing[0].count > 0) {
                return resp(res, 400, 'Phone number already exists');
            }
        } catch (error) {
            console.error('Error checking phone uniqueness:', error);
            return resp(res, 500, 'Internal Server Error');
        }
        fieldsToUpdate.push('phone = ?');
        params.push(phone);
    }
    if (typeof isLive !== 'undefined') {
        
        fieldsToUpdate.push('isLive = ?');
        params.push(isLive ? 1 : 0);
    }
    
    if (fieldsToUpdate.length === 0) {
        return resp(res, 400, 'No fields provided for update');
    }
    
    try {
        const sql = `UPDATE drivers SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
        params.push(req.params.id);
        
        const result = await query(req, sql, params);
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
        const result = await query(req, 'DELETE FROM drivers WHERE id = ?', [req.params.id]);
        if (!result.affectedRows) return resp(res, 404, 'No such driver');
        return resp(res, 200, 'Successfully deleted driver');
    }
    catch (error) {
        console.error('Error deleting driver:', error);
        return resp(res, 500, 'Internal Server Error');
    }
});

module.exports = router;
