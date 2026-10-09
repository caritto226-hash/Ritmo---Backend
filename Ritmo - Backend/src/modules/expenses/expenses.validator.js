function validateCreateExpense(req, res, next) {
	const {
		concept,
		categoryId,
		amount,
		expense_date: expenseDate,
		notes,
	} = req.body || {};

	if (typeof concept !== 'string' || concept.trim() === '') {
		const error = new Error('El concepto es obligatorio');
		error.statusCode = 400;
		return next(error);
	}

	if (concept.trim().length > 100) {
		const error = new Error('El concepto no puede superar los 100 caracteres');
		error.statusCode = 400;
		return next(error);
	}

	if (!isValidCategoryId(categoryId)) {
		const error = new Error('categoryId es obligatorio y debe ser un entero positivo');
		error.statusCode = 400;
		return next(error);
	}

	if (amount === undefined || amount === null || typeof amount !== 'number' || !Number.isFinite(amount) || amount === 0) {
		const error = new Error('El monto es obligatorio y debe ser diferente de cero');
		error.statusCode = 400;
		return next(error);
	}

	if (!hasAtMostTwoDecimals(amount)) {
		const error = new Error('El monto debe tener máximo dos decimales');
		error.statusCode = 400;
		return next(error);
	}

	if (expenseDate !== undefined && expenseDate !== null && (!isValidDateOnly(expenseDate))) {
		const error = new Error('La fecha del gasto debe tener formato YYYY-MM-DD');
		error.statusCode = 400;
		return next(error);
	}

	if (notes !== undefined && notes !== null && typeof notes !== 'string') {
		const error = new Error('Las notas deben ser un texto');
		error.statusCode = 400;
		return next(error);
	}

	req.body.concept = concept.trim();
	req.body.categoryId = categoryId;
	req.body.amount = Number(amount);
	req.body.expense_date = expenseDate === undefined || expenseDate === null ? new Date().toISOString().slice(0, 10) : expenseDate.trim();
	req.body.notes = notes === undefined || notes === null ? null : notes.trim();

	return next();
}

function validateUpdateExpense(req, res, next) {
	const { concept, categoryId, amount, expense_date: expenseDate, notes } = req.body || {};
	const updateData = {};

	if (concept !== undefined) {
		if (typeof concept !== 'string' || concept.trim() === '') {
			const error = new Error('El concepto debe ser un texto no vacío');
			error.statusCode = 400;
			return next(error);
		}

		if (concept.trim().length > 100) {
			const error = new Error('El concepto no puede superar los 100 caracteres');
			error.statusCode = 400;
			return next(error);
		}

		updateData.concept = concept.trim();
	}

	if (categoryId !== undefined) {
		if (!isValidCategoryId(categoryId)) {
			const error = new Error('categoryId debe ser un entero positivo');
			error.statusCode = 400;
			return next(error);
		}

		updateData.categoryId = categoryId;
	}

	if (amount !== undefined) {
		if (typeof amount !== 'number' || !Number.isFinite(amount) || amount === 0) {
			const error = new Error('El monto debe ser diferente de cero');
			error.statusCode = 400;
			return next(error);
		}

		if (!hasAtMostTwoDecimals(amount)) {
			const error = new Error('El monto debe tener máximo dos decimales');
			error.statusCode = 400;
			return next(error);
		}

		updateData.amount = Number(amount);
	}

	if (expenseDate !== undefined) {
		if (!isValidDateOnly(expenseDate)) {
			const error = new Error('La fecha del gasto debe tener formato YYYY-MM-DD y ser válida');
			error.statusCode = 400;
			return next(error);
		}

		updateData.expense_date = expenseDate.trim();
	}

	if (notes !== undefined) {
		if (typeof notes !== 'string') {
			const error = new Error('Las notas deben ser un texto');
			error.statusCode = 400;
			return next(error);
		}

		updateData.notes = notes.trim();
	}

	if (Object.keys(updateData).length === 0) {
		const error = new Error('Debe proporcionar al menos un campo válido para actualizar');
		error.statusCode = 400;
		return next(error);
	}

	req.body = updateData;
	return next();
}

function validateExpenseCategoryFilter(req, res, next) {
	const { categoryId } = req.query;

	if (categoryId !== undefined && !isValidCategoryIdQuery(categoryId)) {
		const error = new Error('categoryId debe ser un entero positivo');
		error.statusCode = 400;
		return next(error);
	}

	return next();
}

function isValidCategoryId(value) {
	return Number.isInteger(value) && value > 0;
}

function isValidCategoryIdQuery(value) {
	return typeof value === 'string' && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function hasAtMostTwoDecimals(amount) {
	const cents = amount * 100;
	return Math.abs(cents - Math.round(cents)) <= Number.EPSILON * Math.max(1, Math.abs(cents)) * 4;
}

function isValidDateOnly(value) {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return false;
	}

	const [year, month, day] = value.slice(0, 10).split('-').map(Number);
	const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

	return month >= 1 && month <= 12 && day >= 1 && day <= lastDayOfMonth;
}

module.exports = {
	validateCreateExpense,
	validateUpdateExpense,
	validateExpenseCategoryFilter,
};
