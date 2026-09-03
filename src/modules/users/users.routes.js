const express = require('express');
const { validateCreateUser } = require('./users.validator');
const usersController = require('./users.controller');

const router = express.Router();

router.post('/', validateCreateUser, usersController.createUser);

module.exports = router;
