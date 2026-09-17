const express = require('express');
const { validateCreateUser, validateUpdateUser, validateStatus } = require('./users.validator');
const usersController = require('./users.controller');

const router = express.Router();

router.post('/', validateCreateUser, usersController.createUser);
router.get('/', usersController.getAll);
router.get('/:id', usersController.getById);
router.put('/:id', validateUpdateUser, usersController.update);
router.patch('/:id/status', validateStatus, usersController.changeStatus);
router.delete('/:id', usersController.remove);


module.exports = router;
