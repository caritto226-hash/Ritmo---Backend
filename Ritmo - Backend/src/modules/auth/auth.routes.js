const express = require('express');
const {
	validateLogin,
	validateForgotPassword,
	validateResetPassword,
} = require('./auth.validator');
const authController = require('./auth.controller');

const router = express.Router();

router.post('/login', validateLogin, authController.login);
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);

module.exports = router;