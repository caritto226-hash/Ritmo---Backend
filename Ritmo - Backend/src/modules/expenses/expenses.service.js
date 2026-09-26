const expensesRepository = require('./expenses.repository');

async function createExpense(userId, expenseData) {
	if (!Number.isInteger(userId) || userId <= 0) {
		const error = new Error('El usuario autenticado no es válido');
		error.statusCode = 401;
		throw error;
	}

	const {
		concept,
		category,
		amount,
		expense_date: expenseDate,
		notes,
	} = expenseData;

	return expensesRepository.create({
		userId,
		concept,
		category,
		amount,
		expenseDate: expenseDate || new Date().toISOString().slice(0, 10),
		notes: notes ?? null,
	});
}

async function getExpenses(userId) {
	if (!Number.isInteger(userId) || userId <= 0) {
		const error = new Error('El usuario autenticado no es válido');
		error.statusCode = 401;
		throw error;
	}

	return expensesRepository.findAllByUser(userId);
}

async function getExpenseById(expenseId, userId) {
	if (!Number.isInteger(expenseId) || expenseId <= 0 || !Number.isInteger(userId) || userId <= 0) {
		const error = new Error('Los identificadores de gasto y usuario no son válidos');
		error.statusCode = 400;
		throw error;
	}

	const expense = await expensesRepository.findByIdAndUser(expenseId, userId);

	if (!expense) {
		const error = new Error('Gasto no encontrado');
		error.statusCode = 404;
		throw error;
	}

	return expense;
}

async function updateExpense(expenseId, userId, data) {
	await getExpenseById(expenseId, userId);

	const dataFiltrada = {};
	const allowedFields = ['concept', 'category', 'amount', 'expense_date', 'notes'];

	for (const field of allowedFields) {
		if (Object.prototype.hasOwnProperty.call(data, field)) {
			dataFiltrada[field] = data[field];
		}
	}

	return expensesRepository.update(expenseId, userId, dataFiltrada);
}

async function deleteExpense(expenseId, userId) {
	await getExpenseById(expenseId, userId);

	await expensesRepository.softDelete(expenseId, userId);
}

module.exports = {
	createExpense,
	getExpenses,
	getExpenseById,
	updateExpense,
	deleteExpense,
};
