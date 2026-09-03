const express = require('express');
const {
	notFoundMiddleware,
	errorMiddleware,
} = require('./middlewares/error.middleware');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;