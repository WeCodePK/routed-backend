const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
app.locals.db = require('./database');

const { auth, resp, genSecret, graceful } = require('./functions');
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = genSecret(32);

app.use(cors());
app.use(express.json());
app.use(morgan('combined', { skip: (req, res) => req.path === '/' }));

app.get('/', (req, res) => {
    res.sendStatus(200);
});

app.use('/api/v0/auth', require('./controllers/auth'));
app.use('/api/v0/routes', auth(), require('./controllers/routes'));
app.use('/api/v0/drivers', auth(), require('./controllers/drivers'));
app.use('/api/v0/assignments', auth(), require('./controllers/assignments'));

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return resp(res, 400, 'Invalid JSON payload')
    }
    next();
});

const server = app.listen(3000, () => {
    console.log(`[INFO] Server is running`);
});

process.on('SIGINT', graceful(app, server));
process.on('SIGTERM', graceful(app, server));
