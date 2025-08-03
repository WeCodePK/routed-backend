const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { auth, resp, query, passwdReqs } = require('../functions');
const { sendMail, forgotPasswordTemplate, driverLoginOtpTemplate } = require('../mailer');


router.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return resp(res, 400, 'Missing or malformed input');

    try {
        const rows = await query(req, 'SELECT email, hash FROM admins WHERE email = ?', [email]);

        if (!rows.length || !(await bcrypt.compare(password, rows[0].hash))) {
            return resp(res, 401, 'Invalid email or password specified');
        }

        return resp(res, 200, 'Login successful', {
            jwt: jwt.sign({ 
                email: rows[0].email 
            }, process.env.JWT_SECRET, { expiresIn: '1h' })
        });
    }

    catch (error) {
        console.error('Error during admin login:', error);
        return resp(res, 500, 'Internal Server Error');
    }
});

router.post('/admin/forgot', async (req, res) => {
    const { email } = req.body;

    if (!email) return resp(res, 400, 'Missing or malformed input');

    try {
        const rows = await query(req, 'SELECT name FROM admins WHERE email = ?', [email]);

        if (rows.length) {

            const resetToken = jwt.sign({
                email, 
                type: 'resetToken', 
            }, process.env.JWT_SECRET, { expiresIn: '15m' });

            await sendMail({ to: email, ...forgotPasswordTemplate({ name: rows[0].name, resetToken, expiry: "15 minutes" }) });
        }

        return resp(res, 200, 'If the user exists, a password reset email has been sent out');
    }

    catch (error) {
        console.error('Error during admin forgot password:', error);
        return resp(res, 500, 'Internal Server Error');
    }
});

router.post('/admin/change', auth(), async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) return resp(res, 400, "Missing or malformed input");
    if (!passwdReqs(newPassword)) return resp(res, 422, 'newPassword does not meet security requirements');

    try {
        const rows = await query(req, 'SELECT hash FROM admins WHERE email = ?', [req.user.email]);

        if (!rows.length || !(await bcrypt.compare(oldPassword, rows[0].hash))) {
            return resp(res, 401, 'Invalid oldPassword');
        }

        await query(req, 'UPDATE admins SET hash = ? WHERE email = ?', [
            await bcrypt.hash(newPassword, 12), req.user.email
        ]);

        return resp(res, 200, 'Password changed successfully');
    }

    catch (error) {
        console.error('Error changing admin password:', error);
        return resp(res, 500, 'Internal Server Error');
    }
});

router.post('/admin/reset', auth({ type: 'resetToken' }), async (req, res) => {
    const { newPassword } = req.body;

    if (!newPassword) return resp(res, 400, "Missing or malformed input");
    if (!passwdReqs(newPassword)) return resp(res, 422, 'newPassword does not meet security requirements');

    try {
        await query(req, 'UPDATE admins SET hash = ? WHERE email = ?', [
            await bcrypt.hash(newPassword, 12), req.user.email
        ]);

        return resp(res, 200, 'Password reset successfully');
    }

    catch (error) {
        console.error('Error resetting admin password:', error);
        return resp(res, 500, 'Internal Server Error');
    }
});

router.post('/driver/otp', async (req, res) => {
    const { email } = req.body;

    if (!email) return resp(res, 400, 'Missing or malformed input');

    try {
        const rows = await query(req, 'SELECT name FROM drivers WHERE email = ?', [email]);

        if (rows.length) {
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
            const otpToken = jwt.sign({ otpCode }, process.env.JWT_SECRET, { expiresIn: '5m' });

            await query(req, 'UPDATE drivers SET otpToken = ? WHERE email = ?', [otpToken, email]);
            await sendMail({ to: email, ...driverLoginOtpTemplate({ name: rows[0].name, otpCode, expiry: "5 minutes" }) });
        }

        return resp(res, 200, 'If the driver exists, a otp email has been sent out');
    }

    catch (error) {
        console.error('Error generating driver OTP:', error);
        return resp(res, 500, 'Internal Server Error');
    }
});

router.post('/driver/login', async (req, res) => {
    const { otp, phone } = req.body;

    if (!otp || !phone) {
        return res.status(400).json({ success: false, message: 'OTP and phone number are required.' });
    }

    try {
        const driverSql = 'SELECT id, contact FROM drivers WHERE contact = ?';
        const driverRows = await query(req, driverSql, [phone]);

        if (driverRows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid phone number or OTP.' });
        }
        const driver = driverRows[0];

        const otpSql = 'SELECT otp, expiresAt FROM driver_otps WHERE driverId = ? AND otp = ?';
        const otpRows = await query(req, otpSql, [driver.id, otp]);

        if (otpRows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid phone number or OTP.' });
        }

        const storedOtp = otpRows[0];
        if (new Date() > new Date(storedOtp.expiresAt)) {
            
            const deleteOtpSql = 'DELETE FROM driver_otps WHERE driverId = ?';
            await query(req, deleteOtpSql, [driver.id]);
            return res.status(401).json({ success: false, message: 'OTP has expired.' });
        }

        const token = jwt.sign(
            { id: driver.id, phone: driver.contact, role: 'driver' }, 
            process.env.JWT_SECRET,
            { expiresIn: '24h' } 
        );

        const deleteOtpSql = 'DELETE FROM driver_otps WHERE driverId = ?';
        await query(req, deleteOtpSql, [driver.id]);

        res.status(200).json({ success: true, message: 'Login successful', data: { jwt: token } });

    } catch (error) {
        console.error('Error during driver login:', error);
        res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
    }
});

module.exports = router;
