const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

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

router.post('/saveDriver', async (req, res) => {
    const { name, email, contact, cnic, passport, address } = req.body;

    if (!name || !email || !contact || !cnic || !passport || !address) {
        return res.status(400).json({ message: 'All driver fields are required.' });
    }

    try {
        
        const checkSql = 'SELECT COUNT(*) AS count FROM drivers WHERE email = ? OR contact = ? OR cnic = ? OR passport = ?';
        const checkParams = [email, contact, cnic, passport];
        const existingRecords = await executeQuery(req, checkSql, checkParams);

        if (existingRecords[0].count > 0) {
            const existingEmail = await executeQuery(req, 'SELECT COUNT(*) AS count FROM drivers WHERE email = ?', [email]);
            if (existingEmail[0].count > 0) {
                return res.status(400).json({ success: false, message: 'Email is already registered', status: 'email' });
            }
            const existingContact = await executeQuery(req, 'SELECT COUNT(*) AS count FROM drivers WHERE contact = ?', [contact]);
            if (existingContact[0].count > 0) {
                return res.status(400).json({ success: false, message: 'Contact is already registered', status: 'contact' });
            }
            const existingCnic = await executeQuery(req, 'SELECT COUNT(*) AS count FROM drivers WHERE cnic = ?', [cnic]);
            if (existingCnic[0].count > 0) {
                return res.status(400).json({ success: false, message: 'CNIC is already registered', status: 'cnic' });
            }
            const existingPassport = await executeQuery(req, 'SELECT COUNT(*) AS count FROM drivers WHERE passport = ?', [passport]);
            if (existingPassport[0].count > 0) {
                return res.status(400).json({ success: false, message: 'Passport is already registered', status: 'passport' });
            }
        }

        const rawPassword = name.substring(0, 3).toLowerCase() + contact.slice(-4);
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        const sql = 'INSERT INTO drivers (name, email, contact, cnic, passport, address, password) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const params = [name, email, contact, cnic, passport, address, hashedPassword];
        const result = await executeQuery(req, sql, params);

        res.status(201).json({
            success: true,
            message: 'Driver registered successfully',
            rawPassword,
            id: result.insertId
        });
    } catch (error) {
        console.error('Error saving driver:', error);
        res.status(500).json({ success: false, message: 'Server error while saving driver', error: error.message });
    }
});

router.put('/:id', async (req, res) => {
    const driverId = req.params.id;
    const { name, email, contact, cnic, passport, address, status, password } = req.body;

    if (cnic) {
        return res.status(403).json({ message: 'Updating CNIC is not allowed.' });
    }
    if (passport) {
        return res.status(403).json({ message: 'Updating Passport is not allowed.' });
    }
    if (password) {
        return res.status(403).json({ message: 'Updating Password is not allowed.' });
    }

    let sql = 'UPDATE drivers SET ';
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
    if (contact) {
        fieldsToUpdate.push('contact = ?');
        params.push(contact);
    }
    if (address) {
        fieldsToUpdate.push('address = ?');
        params.push(address);
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

router.get("/getDrivers", async(req, res) => {
    try {
        const sql = 'SELECT * FROM drivers';
        const drivers = await executeQuery(req, sql);
        res.status(200).json({ message: "Drivers retrieved successfully", driver: drivers });
    } catch (error) {
        console.error('Error getting drivers:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
