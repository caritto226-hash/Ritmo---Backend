const express = require('express');
const {
	notFoundMiddleware,
	errorMiddleware,
} = require('./middlewares/error.middleware');
const usersRouter = require('./modules/users');
const authRouter = require('./modules/auth');
const tasksRouter = require('./modules/tasks');
const eventsRouter = require('./modules/events');
const expensesRouter = require('./modules/expenses');
const habitsRouter = require('./modules/habits');
const dashboardRouter = require('./modules/dashboard');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/events', eventsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/habits', habitsRouter);
app.use('/api/dashboard', dashboardRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;