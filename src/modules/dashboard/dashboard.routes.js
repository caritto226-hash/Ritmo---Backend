const express = require('express');
const dashboardController = require('./dashboard.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get('/', verifyToken, dashboardController.getDashboard);

module.exports = router;
