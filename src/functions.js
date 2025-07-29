const jwt = require('jsonwebtoken')

module.exports = {

    async query(req, sql, params = []) {
        const pool = req.app.locals.db;
        const [rows] = await pool.execute(sql, params);
        return rows;
    },

    resp(res, code, message, data = {}) {
        res.status(code).json({
            data, message,
            success: (code >= 200 && code <= 299)
        })
    },

    auth(req, res, next) {
        const authHeader = req.get('Authorization');
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) return this.resp(res, 401, 'Invalid or expired auth token');

        try {
            req.user = jwt.verify(token, process.env.JWT_SECRET);
            next();
        }

        catch (error) {
            return this.resp(res, 401, 'Invalid or expired auth token');
        }
    },

};
