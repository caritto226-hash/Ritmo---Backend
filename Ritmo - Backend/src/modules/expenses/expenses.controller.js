const expensesService = require('./expenses.service');

async function createExpense(req, res, next) {
	try {
		const expense = await expensesService.createExpense(req.user.id, req.body);

		return res.status(201).json(expense);
	} catch (error) {
		return next(error);
	}
}

async function getExpenses(req, res, next) {
	try {
		const expenses = await expensesService.getExpenses(req.user.id);

		return res.status(200).json({ data: expenses });
	} catch (error) {
		return next(error);
	}
}

async function getExpenseById(req, res, next) {
	try {
		const expenseId = Number(req.params.id);
		const expense = await expensesService.getExpenseById(expenseId, req.user.id);

		return res.status(200).json({ data: expense });
	} catch (error) {
		return next(error);
	}
}

async function updateExpense(req, res, next) {
	try {
		const expenseId = Number(req.params.id);
		const expense = await expensesService.updateExpense(expenseId, req.user.id, req.body);

		return res.status(200).json({ data: expense });
	} catch (error) {
		return next(error);
	}
}

async function deleteExpense(req, res, next) {
	try {
		const expenseId = Number(req.params.id);
		await expensesService.deleteExpense(expenseId, req.user.id);

		return res.status(200).json({ message: 'Gasto eliminado correctamente' });
	} catch (error) {
		return next(error);
	}
}

module.exports = {
	createExpense,
	getExpenses,
	getExpenseById,
	updateExpense,
	deleteExpense,
};
