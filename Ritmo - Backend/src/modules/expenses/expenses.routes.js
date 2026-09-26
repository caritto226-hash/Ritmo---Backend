const express = require('express');
const {
	validateCreateExpense,
	validateUpdateExpense,
} = require('./expenses.validator');
const expensesController = require('./expenses.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.post('/', verifyToken, validateCreateExpense, expensesController.createExpense);
router.get('/', verifyToken, expensesController.getExpenses);
router.get('/:id', verifyToken, expensesController.getExpenseById);
router.put('/:id', verifyToken, validateUpdateExpense, expensesController.updateExpense);
router.delete('/:id', verifyToken, expensesController.deleteExpense);

module.exports = router;
