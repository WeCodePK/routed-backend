// controllers/profileController.js

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

// GET /admin/profile
// Assuming there's only one admin profile or a default one to retrieve.
// If there are multiple, you might need an ID or authentication to identify which one.
// For now, let's just get the first one or a specific one (e.g., ID 1).
router.get('/', async (req, res) => {
    // In a real app, this would be `req.user.id` from authentication
    const adminId = 1; // For simplicity, fetching admin with ID 1

    try {
        const sql = 'SELECT id, name, email FROM admin_profiles WHERE id = ?'; // Exclude password_hash
        const params = [adminId];
        const result = await executeQuery(req, sql, params);

        if (result.length === 0) {
            return res.status(404).json({ message: 'Admin profile not found.' });
        }
        res.status(200).json(result[0]);
    } catch (error) {
        console.error('Error getting admin profile:', error);
        res.status(500).json({ message: 'Error retrieving admin profile', error: error.message });
    }
});

// PUT /admin/profile
// Updates the admin profile. Again, assuming a specific ID or an authenticated user.
router.put('/', async (req, res) => {
    const adminId = 1; // For simplicity, updating admin with ID 1
    const { name, email } = req.body;

    if (!name && !email) {
        return res.status(400).json({ message: 'At least one field (name or email) is required for update.' });
    }

    let sql = 'UPDATE admin_profiles SET ';
    const params = [];
    const fieldsToUpdate = [];

    if (name) {
        fieldsToUpdate.push('name = ?');
        params.push(name);
    }
    if (email) {
        fieldsToUpdate.push('email = ?');
        params.push(email);
    }

    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }

    sql += fieldsToUpdate.join(', ') + ' WHERE id = ?';
    params.push(adminId);

    try {
        const result = await executeQuery(req, sql, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Admin profile not found or no changes made.' });
        }
        res.status(200).json({ message: 'Admin profile updated successfully.' });
    } catch (error) {
        console.error('Error updating admin profile:', error);
        res.status(500).json({ message: 'Error updating admin profile', error: error.message });
    }
});


module.exports = router;