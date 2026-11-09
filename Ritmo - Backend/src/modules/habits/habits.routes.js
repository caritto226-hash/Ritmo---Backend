const express = require('express');
const {
	validateCreateHabit,
	validateUpdateHabit,
	validateHabitStatus,
	validateHabitProgress,
	validateProgressRange,
} = require('./habits.validator');
const habitsController = require('./habits.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { validateIdParam } = require('../../middlewares/id-param.middleware');

const router = express.Router();

router.param('id', validateIdParam);

router.post('/', verifyToken, validateCreateHabit, habitsController.createHabit);
router.get('/', verifyToken, habitsController.getHabits);
// Antes de /:id: si no, "progress" y "stats" llegarían como id y validateIdParam las rechazaría.
router.get('/progress', verifyToken, validateProgressRange, habitsController.getProgress);
router.get('/stats', verifyToken, habitsController.getStats);
router.get('/:id', verifyToken, habitsController.getHabitById);
router.put('/:id', verifyToken, validateUpdateHabit, habitsController.updateHabit);
router.patch('/:id/status', verifyToken, validateHabitStatus, habitsController.changeStatus);
router.patch('/:id/progress', verifyToken, validateHabitProgress, habitsController.updateProgress);
router.delete('/:id', verifyToken, habitsController.deleteHabit);

module.exports = router;
