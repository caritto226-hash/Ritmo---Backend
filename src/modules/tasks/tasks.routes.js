const express = require('express');
const { validateCreateTask, validateUpdateTask } = require('./tasks.validator');
const tasksController = require('./tasks.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.post('/', verifyToken, validateCreateTask, tasksController.create);
router.get('/', verifyToken, tasksController.getTasks);
router.get('/:id', verifyToken, tasksController.getTaskById);
router.put('/:id', verifyToken, validateUpdateTask, tasksController.updateTask);

module.exports = router;