const jwt = require('jsonwebtoken')

module.exports = {

    passwdReqs(newPass) {
        return newPass.length >= 12 && newPass.length <= 64
    },

    async query(req, sql, params = []) {
        const pool = req.app.locals.db;
        const [rows] = await pool.execute(sql, params);
        return rows;
    },

    resp(res, code, message, data = {}) {
        return res.status(code).json({
            success: (code >= 200 && code <= 299),
            message,
            data
        })
    },

    auth(options = {}) {
        return (req, res, next) => {
            const authHeader = req.get('Authorization');
            const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

            if (!token) return module.exports.resp(res, 401, 'Missing auth token');

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                if (options.type && decoded.type !== options.type) {
                    return module.exports.resp(res, 403, 'Invalid token type');
                }

                req.user = decoded;
                next();
            }
            
            catch (error) {
                return module.exports.resp(res, 401, 'Invalid or expired auth token');
            }
        }
    },

};