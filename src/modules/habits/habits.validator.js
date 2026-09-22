const allowedStatuses = new Set(['pendiente', 'completado']);

function validateCreateHabit(req, res, next) {
	const { name, frequency, goal } = req.body || {};

	if (!isValidName(name)) {
		return next(createError('El nombre es obligatorio y no puede superar los 100 caracteres'));
	}

	if (!isValidText(frequency)) {
		return next(createError('La frecuencia es obligatoria y debe ser un texto'));
	}

	if (goal !== undefined && goal !== null && !isValidGoal(goal)) {
		return next(createError('La meta debe ser un entero positivo'));
	}

	req.body.name = name.trim();
	req.body.frequency = frequency.trim();
	req.body.goal = goal === undefined || goal === null ? null : goal;

	return next();
}

function validateUpdateHabit(req, res, next) {
	const { name, frequency, goal } = req.body || {};
	const updateData = {};

	if (name !== undefined) {
		if (!isValidName(name)) {
			return next(createError('El nombre debe ser un texto no vacío de hasta 100 caracteres'));
		}

		updateData.name = name.trim();
	}

	if (frequency !== undefined) {
		if (!isValidText(frequency)) {
			return next(createError('La frecuencia debe ser un texto no vacío'));
		}

		updateData.frequency = frequency.trim();
	}

	if (goal !== undefined) {
		if (!isValidGoal(goal) && goal !== null) {
			return next(createError('La meta debe ser un entero positivo'));
		}

		updateData.goal = goal;
	}

	if (Object.keys(updateData).length === 0) {
		return next(createError('Debe proporcionar al menos un campo válido para actualizar'));
	}

	req.body = updateData;
	return next();
}

function validateHabitStatus(req, res, next) {
	const { status } = req.body || {};

	if (typeof status !== 'string' || !allowedStatuses.has(status)) {
		return next(createError('El estado debe ser pendiente o completado'));
	}

	return next();
}

function isValidName(value) {
	return isValidText(value) && value.trim().length <= 100;
}

function isValidText(value) {
	return typeof value === 'string' && value.trim() !== '';
}

function isValidGoal(value) {
	return Number.isInteger(value) && value > 0;
}

function createError(message) {
	const error = new Error(message);
	error.statusCode = 400;
	return error;
}

module.exports = {
	validateCreateHabit,
	validateUpdateHabit,
	validateHabitStatus,
};