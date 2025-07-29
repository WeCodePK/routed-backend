const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
const { auth } = require('./util');
app.locals.db = require('./database');

app.use(cors());
app.use(morgan());
app.use(express.json());

app.get('/', (req, res) => {
    res.sendStatus(200);
});

app.use('/api/v0/auth', require('./controllers/authController'));
app.use('/api/v0/routes', auth, require('./controllers/routesController'));
app.use('/api/v0/drivers', auth, require('./controllers/driversController'));
app.use('/api/v0/assignments', auth, require('./controllers/assignmentsController'));

app.listen(3000, () => {
    console.log(`[INFO] Server is running`);
});
