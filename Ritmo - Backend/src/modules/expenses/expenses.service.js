const expensesRepository = require('./expenses.repository');
const categoriesRepository = require('../categories/categories.repository');

async function createExpense(userId, expenseData) {
	if (!Number.isInteger(userId) || userId <= 0) {
		const error = new Error('El usuario autenticado no es válido');
		error.statusCode = 401;
		throw error;
	}

	const {
		concept,
		categoryId,
		amount,
		expense_date: expenseDate,
		notes,
	} = expenseData;

	await validateFinanceCategory(categoryId, userId);

	return expensesRepository.create({
		userId,
		concept,
		categoryId,
		amount,
		expenseDate: expenseDate || new Date().toISOString().slice(0, 10),
		notes: notes ?? null,
	});
}

async function getExpenses(userId, categoryId) {
	if (!Number.isInteger(userId) || userId <= 0) {
		const error = new Error('El usuario autenticado no es válido');
		error.statusCode = 401;
		throw error;
	}

	if (categoryId !== undefined && (!Number.isInteger(categoryId) || categoryId <= 0)) {
		throw badRequestError('El identificador de categoría no es válido');
	}

	return expensesRepository.findAllByUser(userId, categoryId);
}

async function getMonthlySummary(userId) {
	if (!Number.isInteger(userId) || userId <= 0) {
		const error = new Error('El usuario autenticado no es válido');
		error.statusCode = 401;
		throw error;
	}

	const summary = await expensesRepository.getMonthlySummaryByUser(userId);

	return {
		income: Number(summary.income),
		expenses: Number(summary.expenses),
		balance: Number(summary.balance),
	};
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
	const currentExpense = await getExpenseById(expenseId, userId);
	if (Object.prototype.hasOwnProperty.call(data, 'categoryId')
		&& data.categoryId !== currentExpense.categoryId) {
		await validateFinanceCategory(data.categoryId, userId);
	}

	const dataFiltrada = {};
	const allowedFields = ['concept', 'categoryId', 'amount', 'expense_date', 'notes'];

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

async function validateFinanceCategory(categoryId, userId) {
	if (!Number.isInteger(categoryId) || categoryId <= 0) {
		throw badRequestError('El identificador de categoría no es válido');
	}

	const category = await categoriesRepository.findByIdAndUser(categoryId, userId);
	if (!category || category.module !== 'finance') {
		const error = new Error('Categoría financiera no encontrada');
		error.statusCode = 404;
		throw error;
	}
}

function badRequestError(message) {
	const error = new Error(message);
	error.statusCode = 400;
	return error;
}

module.exports = {
	createExpense,
	getExpenses,
	getMonthlySummary,
	getExpenseById,
	updateExpense,
	deleteExpense,
};
