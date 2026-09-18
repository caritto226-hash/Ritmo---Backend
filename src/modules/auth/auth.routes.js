const express = require('express');
const { validateLogin } = require('./auth.validator');
const authController = require('./auth.controller');

const router = express.Router();

router.post('/login', validateLogin, authController.login);

module.exports = router;