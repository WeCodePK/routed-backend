const express = require('express');
const dbPool = require('./database');
const { authMiddleware } = require('./util');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.locals.dbPool = dbPool;

app.use(cors({
    origin: 'https://routed-web.wckd.pk',
    methods: ['Get', 'Post', 'Put', 'Delete'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
}))

app.get('/', (req, res) => {
    res.sendStatus(200);
});

app.use('/api/v0/auth', require('./controllers/authController'));
app.use('/api/v0/routes', authMiddleware, require('./controllers/routesController'));
app.use('/api/v0/drivers', authMiddleware, require('./controllers/driversController'));
app.use('/api/v0/tracking', authMiddleware, require('./controllers/trackingController'));
app.use('/api/v0/violations', authMiddleware, require('./controllers/violationsController'));
app.use('/api/v0/admin/profile', authMiddleware, require('./controllers/profileController'));
app.use('/api/v0/assignments', authMiddleware, require('./controllers/assignmentsController'));

app.listen(80, () => {
    console.log(`Server is running`);
});
