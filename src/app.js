const express = require('express');
const {
	notFoundMiddleware,
	errorMiddleware,
} = require('./middlewares/error.middleware');
const usersRouter = require('./modules/users');
const authRouter = require('./modules/auth');
const tasksRouter = require('./modules/tasks');
const expensesRouter = require('./modules/expenses');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/expenses', expensesRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;