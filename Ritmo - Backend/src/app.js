const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
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
const categoriesRouter = require('./modules/categories');
const app = express();

// Orígenes permitidos separados por comas en CORS_ORIGIN; por defecto, el servidor de Vite.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
	.split(',')
	.map((origin) => origin.trim())
	.filter(Boolean);

app.disable('x-powered-by');
app.use(helmet());
app.use(express.json());

app.use(
  cors({
    origin: allowedOrigins,
  })
);

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
app.use('/api/categories', categoriesRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
