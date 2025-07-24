const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const sql = 'SELECT id, email, password_hash FROM admin_profiles WHERE email = ?';
        const [rows] = await dbPool.execute(sql, [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const admin = rows[0];
        const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { id: admin.id, email: admin.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } 
        );

        res.status(200).json({ message: 'Login successful', token });

    } catch (error) {
        console.error('Error during admin login:', error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
});

module.exports = router;
