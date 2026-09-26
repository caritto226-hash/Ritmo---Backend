const express = require('express');
const {
	validateCreateTask,
	validateUpdateTask,
	validateTaskStatus,
} = require('./tasks.validator');
const tasksController = require('./tasks.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.post('/', verifyToken, validateCreateTask, tasksController.create);
router.get('/', verifyToken, tasksController.getTasks);
router.get('/:id', verifyToken, tasksController.getTaskById);
router.put('/:id', verifyToken, validateUpdateTask, tasksController.updateTask);
router.patch('/:id/status', verifyToken, validateTaskStatus, tasksController.changeStatus);
router.delete('/:id', verifyToken, tasksController.deleteTask);

module.exports = router;