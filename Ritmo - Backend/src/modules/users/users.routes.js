const express = require('express');
const { validateCreateUser, validateUpdateUser, validateStatus } = require('./users.validator');
const usersController = require('./users.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { requireRole, requireSelfOrRole } = require('../../middlewares/role.middleware');

const router = express.Router();

router.post('/', validateCreateUser, usersController.createUser);
router.get('/', verifyToken, requireRole(2), usersController.getAll);
router.get('/:id', verifyToken, requireSelfOrRole(2), usersController.getById);
router.put('/:id', verifyToken, requireSelfOrRole(2), validateUpdateUser, usersController.update);
router.patch('/:id/status', verifyToken, requireRole(2), validateStatus, usersController.changeStatus);
router.delete('/:id', verifyToken, requireSelfOrRole(2), usersController.remove);


module.exports = router;
