const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../util'); 

router.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    try {
        const sql = 'SELECT id, email, password_hash FROM admin_profiles WHERE email = ?';
        const rows = await executeQuery(req, sql, [email]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'no record found' });
        }

        const admin = rows[0];

        
        if (password !== admin.password_hash) {
            console.log(admin.password_hash);
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { id: admin.id, email: admin.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ success: true, message: 'Login successful', data: { jwt: token } });

    } catch (error) {
        console.error('Error during admin login:', error);
        res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
    }
});


router.post('/admin/change', async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    
    const adminId = req.admin.id; 

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Old password and new password are required.' });
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
        return res.status(422).json({ success: false, message: 'Password does not meet security requirements. It must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.' });
    }

    try {
        const sql = 'SELECT password_hash FROM admin_profiles WHERE id = ?';
        const rows = await executeQuery(req, sql, [adminId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Admin not found.' }); 
        }

        const admin = rows[0];
        const isPasswordValid = await bcrypt.compare(oldPassword, admin.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid old password.' });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        const updateSql = 'UPDATE admin_profiles SET password_hash = ? WHERE id = ?';
        const updateResult = await executeQuery(req, updateSql, [newPasswordHash, adminId]);

        if (updateResult.affectedRows === 0) {
            return res.status(500).json({ success: false, message: 'Failed to update password or no changes made.' });
        }

        res.status(200).json({ success: true, message: 'Password changed successfully.' });

    } catch (error) {
        console.error('Error changing admin password:', error);
        res.status(500).json({ success: false, message: 'Server error during password change', error: error.message });
    }
});

router.post('/admin/forgot', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    try {
        const sql = 'SELECT id FROM admin_profiles WHERE email = ?';
        const rows = await executeQuery(req, sql, [email]);

        if (rows.length === 0) {
            return res.status(200).json({ success: true, message: 'If the user exists, a password reset email has been sent out.' });
        }

        const admin = rows[0];
        const resetToken = jwt.sign(
            { id: admin.id, type: 'passwordReset' },
            process.env.JWT_SECRET,
            { expiresIn: '15m' } 
        );

        const insertTokenSql = 'INSERT INTO password_reset_tokens (userId, token, expiresAt) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE)) ON DUPLICATE KEY UPDATE token = ?, expiresAt = DATE_ADD(NOW(), INTERVAL 15 MINUTE)';
        await executeQuery(req, insertTokenSql, [admin.id, resetToken, resetToken]);

        console.log(`Password reset email sent to ${email} with token: ${resetToken}`);

        res.status(200).json({ success: true, message: 'If the user exists, a password reset email has been sent out.' });

    } catch (error) {
        console.error('Error during admin forgot password:', error);
        res.status(500).json({ success: false, message: 'Server error during forgot password request', error: error.message });
    }
});

router.post('/admin/reset', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
        return res.status(422).json({ success: false, message: 'Password does not meet security requirements. It must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const adminId = decoded.id;

        const checkTokenSql = 'SELECT * FROM password_reset_tokens WHERE userId = ? AND token = ? AND expiresAt > NOW()';
        const tokenRows = await executeQuery(req, checkTokenSql, [adminId, token]);

        if (tokenRows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid or expired reset token.' });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        const updateSql = 'UPDATE admin_profiles SET password_hash = ? WHERE id = ?';
        const updateResult = await executeQuery(req, updateSql, [newPasswordHash, adminId]);

        const deleteTokenSql = 'DELETE FROM password_reset_tokens WHERE token = ?';
        await executeQuery(req, deleteTokenSql, [token]);


        if (updateResult.affectedRows === 0) {
            return res.status(500).json({ success: false, message: 'Failed to reset password or no changes made.' });
        }

        res.status(200).json({ success: true, message: 'Password reset successfully.' });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Access Denied: Reset token has expired.' });
        }
        console.error('Error resetting admin password:', error);
        res.status(500).json({ success: false, message: 'Server error during password reset', error: error.message });
    }
});

router.post('/driver/otp', async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    try {
        const sql = 'SELECT id FROM drivers WHERE contact = ?';
        const rows = await executeQuery(req, sql, [phone]);

        if (rows.length === 0) {
            return res.status(200).json({ success: true, message: 'If the user exists, an OTP has been sent to their phone number.' });
        }

        const driver = rows[0];
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); 
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); 

        const insertOtpSql = 'INSERT INTO driver_otps (driverId, otp, expiresAt) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp = ?, expiresAt = ?';
        await executeQuery(req, insertOtpSql, [driver.id, otp, expiresAt, otp, expiresAt]);

        console.log(`OTP for ${phone}: ${otp}`); 

        res.status(200).json({ success: true, message: 'If the user exists, an OTP has been sent to their phone number.' });

    } catch (error) {
        console.error('Error generating driver OTP:', error);
        res.status(500).json({ success: false, message: 'Server error during OTP generation', error: error.message });
    }
});

router.post('/driver/login', async (req, res) => {
    const { otp, phone } = req.body;

    if (!otp || !phone) {
        return res.status(400).json({ success: false, message: 'OTP and phone number are required.' });
    }

    try {
        const driverSql = 'SELECT id, contact FROM drivers WHERE contact = ?';
        const driverRows = await executeQuery(req, driverSql, [phone]);

        if (driverRows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid phone number or OTP.' });
        }
        const driver = driverRows[0];

        const otpSql = 'SELECT otp, expiresAt FROM driver_otps WHERE driverId = ? AND otp = ?';
        const otpRows = await executeQuery(req, otpSql, [driver.id, otp]);

        if (otpRows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid phone number or OTP.' });
        }

        const storedOtp = otpRows[0];
        if (new Date() > new Date(storedOtp.expiresAt)) {
            
            const deleteOtpSql = 'DELETE FROM driver_otps WHERE driverId = ?';
            await executeQuery(req, deleteOtpSql, [driver.id]);
            return res.status(401).json({ success: false, message: 'OTP has expired.' });
        }

        const token = jwt.sign(
            { id: driver.id, phone: driver.contact, role: 'driver' }, 
            process.env.JWT_SECRET,
            { expiresIn: '24h' } 
        );

        const deleteOtpSql = 'DELETE FROM driver_otps WHERE driverId = ?';
        await executeQuery(req, deleteOtpSql, [driver.id]);

        res.status(200).json({ success: true, message: 'Login successful', data: { jwt: token } });

    } catch (error) {
        console.error('Error during driver login:', error);
        res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
    }
});

module.exports = router;