const express = require('express');
const {
	notFoundMiddleware,
	errorMiddleware,
} = require('./middlewares/error.middleware');
const usersRouter = require('./modules/users');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

app.use('/api/users', usersRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;