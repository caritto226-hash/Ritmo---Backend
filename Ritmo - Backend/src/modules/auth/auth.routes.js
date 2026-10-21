const express = require('express');
const {
	validateLogin,
	validateForgotPassword,
	validateResetPassword,
} = require('./auth.validator');
const authController = require('./auth.controller');
const { loginLimiter, passwordRecoveryLimiter } = require('../../middlewares/rate-limit.middleware');

const router = express.Router();

router.post('/login', validateLogin, loginLimiter, authController.login);
router.post('/forgot-password', validateForgotPassword, passwordRecoveryLimiter, authController.forgotPassword);
router.post('/reset-password', passwordRecoveryLimiter, validateResetPassword, authController.resetPassword);

module.exports = router;