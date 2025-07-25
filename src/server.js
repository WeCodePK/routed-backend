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

app.use('/auth', require('./controllers/authController'));
app.use('/routes', authMiddleware, require('./controllers/routesController'));
app.use('/drivers', authMiddleware, require('./controllers/driversController'));
app.use('/tracking', authMiddleware, require('./controllers/trackingController'));
app.use('/violations', authMiddleware, require('./controllers/violationsController'));
app.use('/admin/profile', authMiddleware, require('./controllers/profileController'));
app.use('/assignments', authMiddleware, require('./controllers/assignmentsController'));

app.listen(80, () => {
    console.log(`Server is running`);
});
