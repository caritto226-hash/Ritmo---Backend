const express = require('express');
const { validateCreateUser, validateUpdateUser, validateStatus } = require('./users.validator');
const usersController = require('./users.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

const router = express.Router();

router.post('/', validateCreateUser, usersController.createUser);
router.get('/', verifyToken, requireRole(2), usersController.getAll);
router.get('/:id', usersController.getById);
router.put('/:id', validateUpdateUser, usersController.update);
router.patch('/:id/status', validateStatus, usersController.changeStatus);
router.delete('/:id', usersController.remove);


module.exports = router;
