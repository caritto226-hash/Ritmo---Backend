function validateCreateExpense(req, res, next) {
	const {
		concept,
		category,
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

	if (typeof category !== 'string' || category.trim() === '') {
		const error = new Error('La categoría es obligatoria');
		error.statusCode = 400;
		return next(error);
	}

	if (category.trim().length > 45) {
		const error = new Error('La categoría no puede superar los 45 caracteres');
		error.statusCode = 400;
		return next(error);
	}

	if (amount === undefined || amount === null || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
		const error = new Error('El monto es obligatorio y debe ser un número positivo');
		error.statusCode = 400;
		return next(error);
	}

	if (!Number.isInteger((amount * 100)) || amount <= 0) {
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
	req.body.category = category.trim();
	req.body.amount = Number(amount);
	req.body.expense_date = expenseDate === undefined || expenseDate === null ? new Date().toISOString().slice(0, 10) : expenseDate.trim();
	req.body.notes = notes === undefined || notes === null ? null : notes.trim();

	return next();
}

function validateUpdateExpense(req, res, next) {
	const { concept, category, amount, expense_date: expenseDate, notes } = req.body || {};
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

	if (category !== undefined) {
		if (typeof category !== 'string' || category.trim() === '') {
			const error = new Error('La categoría debe ser un texto no vacío');
			error.statusCode = 400;
			return next(error);
		}

		if (category.trim().length > 45) {
			const error = new Error('La categoría no puede superar los 45 caracteres');
			error.statusCode = 400;
			return next(error);
		}

		updateData.category = category.trim();
	}

	if (amount !== undefined) {
		if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
			const error = new Error('El monto debe ser un número positivo');
			error.statusCode = 400;
			return next(error);
		}

		if (!Number.isInteger(amount * 100)) {
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
};
