const express = require('express');
const {
	validateCreateHabit,
	validateUpdateHabit,
	validateHabitStatus,
} = require('./habits.validator');
const habitsController = require('./habits.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.post('/', verifyToken, validateCreateHabit, habitsController.createHabit);
router.get('/', verifyToken, habitsController.getHabits);
router.get('/:id', verifyToken, habitsController.getHabitById);
router.put('/:id', verifyToken, validateUpdateHabit, habitsController.updateHabit);
router.patch('/:id/status', verifyToken, validateHabitStatus, habitsController.changeStatus);
router.delete('/:id', verifyToken, habitsController.deleteHabit);

module.exports = router;