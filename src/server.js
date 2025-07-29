const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
app.locals.db = require('./database');
const { auth } = require('./functions');

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

app.listen(3000, () => {
    console.log(`[INFO] Server is running`);
});
