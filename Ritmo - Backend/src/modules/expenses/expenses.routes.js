const express = require('express');
const {
	validateCreateExpense,
	validateUpdateExpense,
	validateExpenseCategoryFilter,
} = require('./expenses.validator');
const expensesController = require('./expenses.controller');
const recurrencesController = require('./recurrences.controller');
const {
	validateCreateRecurrence,
	validateConfirmOccurrence,
	validateOccurrenceId,
	validateCancelRecurrence,
} = require('./recurrences.validator');
const { verifyToken } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.post('/', verifyToken, validateCreateExpense, expensesController.createExpense);
router.post('/recurrences', verifyToken, validateCreateRecurrence, recurrencesController.createRecurrence);
router.get('/recurrences/reminders', verifyToken, recurrencesController.getReminders);
router.patch('/recurrences/occurrences/:occurrenceId/confirm', verifyToken, validateOccurrenceId, validateConfirmOccurrence, recurrencesController.confirmOccurrence);
router.delete('/recurrences/:id', verifyToken, validateCancelRecurrence, recurrencesController.cancelRecurrence);
router.get('/', verifyToken, validateExpenseCategoryFilter, expensesController.getExpenses);
router.get('/summary', verifyToken, expensesController.getMonthlySummary);
router.get('/:id', verifyToken, expensesController.getExpenseById);
router.put('/:id', verifyToken, validateUpdateExpense, expensesController.updateExpense);
router.delete('/:id', verifyToken, expensesController.deleteExpense);

module.exports = router;
