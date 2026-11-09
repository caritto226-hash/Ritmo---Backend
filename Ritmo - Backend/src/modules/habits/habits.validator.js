const { isValidDateKey, diffInDays } = require('../../utils/dates');
const { daysToMask, frequencyLabel, parseLegacyFrequency } = require('../../utils/habit-days');

const allowedStatuses = new Set(['pendiente', 'completado']);
const allowedGoalTypes = new Set(['check', 'count', 'duration']);
// Coincide con habits.frequency VARCHAR(100).
const MAX_FREQUENCY_LENGTH = 100;
// Coincide con habits.unit VARCHAR(20).
const MAX_UNIT_LENGTH = 20;
// El tope de cada tipo (999 de cantidad, 1440 minutos) lo revisa el servicio, que conoce el tipo final.
const MAX_GOAL = 1440;
const MAX_AMOUNT = 9999;
const MAX_RANGE_DAYS = 366;

function validateCreateHabit(req, res, next) {
	const { name, categoryId, reminderTime } = req.body || {};

	if (!isValidName(name)) {
		return next(createError('El nombre es obligatorio y no puede superar los 100 caracteres'));
	}

	const schedule = readSchedule(req.body);
	if (schedule.error) {
		return next(schedule.error);
	}
	if (!schedule.value) {
		return next(createError('Elige al menos un día de la semana'));
	}

	const goal = readGoal(req.body);
	if (goal.error) {
		return next(goal.error);
	}

	if (categoryId !== undefined && categoryId !== null && !isValidCategoryId(categoryId)) {
		return next(createError('categoryId debe ser un entero positivo'));
	}
	if (reminderTime !== undefined && reminderTime !== null && !isValidTime(reminderTime)) {
		return next(createError('La hora del recordatorio debe tener formato HH:mm'));
	}

	req.body = {
		name: name.trim(),
		...schedule.value,
		...goal.value,
		categoryId: categoryId ?? null,
		reminderTime: reminderTime ?? null,
	};

	return next();
}

function validateUpdateHabit(req, res, next) {
	const { name, categoryId, reminderTime } = req.body || {};
	const updateData = {};

	if (name !== undefined) {
		if (!isValidName(name)) {
			return next(createError('El nombre debe ser un texto no vacío de hasta 100 caracteres'));
		}

		updateData.name = name.trim();
	}

	const schedule = readSchedule(req.body);
	if (schedule.error) {
		return next(schedule.error);
	}
	Object.assign(updateData, schedule.value);

	const goal = readGoal(req.body);
	if (goal.error) {
		return next(goal.error);
	}
	Object.assign(updateData, goal.value);

	if (categoryId !== undefined) {
		if (categoryId !== null && !isValidCategoryId(categoryId)) {
			return next(createError('categoryId debe ser un entero positivo'));
		}

		updateData.categoryId = categoryId;
	}

	// El recordatorio se valida por separado: ya no depende de que llegue categoryId.
	if (reminderTime !== undefined) {
		if (reminderTime !== null && !isValidTime(reminderTime)) {
			return next(createError('La hora del recordatorio debe tener formato HH:mm'));
		}

		updateData.reminderTime = reminderTime;
	}

	if (Object.keys(updateData).length === 0) {
		return next(createError('Debe proporcionar al menos un campo válido para actualizar'));
	}

	req.body = updateData;
	return next();
}

function validateHabitStatus(req, res, next) {
	const { status, date } = req.body || {};
	const normalizedStatus = typeof status === 'string' ? status.trim().toLowerCase() : '';

	if (!allowedStatuses.has(normalizedStatus)) {
		return next(createError('El estado debe ser pendiente o completado'));
	}
	if (date !== undefined && date !== null && !isValidDateKey(date)) {
		return next(createError('La fecha debe tener formato YYYY-MM-DD'));
	}

	req.body = { status: normalizedStatus, date: date ?? null };
	return next();
}

// Avance de un día: amount fija el valor exacto (0 lo borra) y delta suma o resta. Solo uno.
function validateHabitProgress(req, res, next) {
	const { date, amount, delta } = req.body || {};
	const hasAmount = amount !== undefined && amount !== null;
	const hasDelta = delta !== undefined && delta !== null;

	if (date !== undefined && date !== null && !isValidDateKey(date)) {
		return next(createError('La fecha debe tener formato YYYY-MM-DD'));
	}
	if (hasAmount === hasDelta) {
		return next(createError('Envía amount (valor exacto) o delta (cuánto sumar), solo uno de los dos'));
	}
	if (hasAmount && !(Number.isInteger(amount) && amount >= 0 && amount <= MAX_AMOUNT)) {
		return next(createError(`El avance debe ser un entero entre 0 y ${MAX_AMOUNT}`));
	}
	if (hasDelta && !(Number.isInteger(delta) && delta !== 0 && Math.abs(delta) <= MAX_AMOUNT)) {
		return next(createError(`La cantidad a sumar debe ser un entero distinto de 0 entre -${MAX_AMOUNT} y ${MAX_AMOUNT}`));
	}

	req.body = {
		date: date ?? null,
		amount: hasAmount ? amount : null,
		delta: hasDelta ? delta : null,
	};
	return next();
}

function validateProgressRange(req, res, next) {
	const { from, to } = req.query;

	if (!isValidDateKey(from) || !isValidDateKey(to)) {
		return next(createError('from y to son obligatorias y deben tener formato YYYY-MM-DD'));
	}
	if (from > to) {
		return next(createError('from no puede ser posterior a to'));
	}
	if (diffInDays(from, to) + 1 > MAX_RANGE_DAYS) {
		return next(createError(`El rango no puede superar ${MAX_RANGE_DAYS} días`));
	}

	return next();
}

/**
 * Días de la semana. days (ISO, 1 = lunes … 7 = domingo) manda y la etiqueta de frequency se
 * genera a partir de ellos. Sin days, un frequency de texto (clientes anteriores) se interpreta
 * como en la migración y se guarda tal cual. value es null si no llegó ninguno de los dos.
 */
function readSchedule(body) {
	const { days, frequency } = body || {};

	if (days !== undefined) {
		const isValidDays = Array.isArray(days)
			&& days.length > 0
			&& days.every((day) => Number.isInteger(day) && day >= 1 && day <= 7)
			&& new Set(days).size === days.length;

		if (!isValidDays) {
			return { error: createError('days debe ser una lista sin repetidos de días entre 1 (lunes) y 7 (domingo), con al menos uno') };
		}

		const daysMask = daysToMask(days);
		return { value: { daysMask, frequency: frequencyLabel(daysMask) } };
	}

	if (frequency !== undefined) {
		if (!isValidFrequency(frequency)) {
			return { error: createError(`La frecuencia debe ser un texto no vacío de hasta ${MAX_FREQUENCY_LENGTH} caracteres`) };
		}

		return { value: { daysMask: parseLegacyFrequency(frequency), frequency: frequency.trim() } };
	}

	return { value: null };
}

// Forma de goalType, goal y unit. La combinación (meta obligatoria y su tope según el tipo) la
// resuelve el servicio, porque al editar depende de los valores que ya tiene el hábito.
function readGoal(body) {
	const { goalType, goal, unit } = body || {};
	const value = {};

	if (goalType !== undefined) {
		if (!allowedGoalTypes.has(goalType)) {
			return { error: createError('goalType debe ser check, count o duration') };
		}
		value.goalType = goalType;
	}

	if (goal !== undefined) {
		if (goal !== null && !(Number.isInteger(goal) && goal > 0 && goal <= MAX_GOAL)) {
			return { error: createError('La meta debe ser un entero positivo') };
		}
		value.goal = goal;
	}

	if (unit !== undefined) {
		if (unit !== null && typeof unit !== 'string') {
			return { error: createError('La unidad debe ser texto') };
		}

		const trimmedUnit = unit === null ? '' : unit.trim();
		if (Array.from(trimmedUnit).length > MAX_UNIT_LENGTH) {
			return { error: createError(`La unidad no puede superar los ${MAX_UNIT_LENGTH} caracteres`) };
		}
		value.unit = trimmedUnit === '' ? null : trimmedUnit;
	}

	return { value };
}

function isValidName(value) {
	return isValidText(value) && value.trim().length <= 100;
}

function isValidFrequency(value) {
	return isValidText(value) && value.trim().length <= MAX_FREQUENCY_LENGTH;
}

function isValidText(value) {
	return typeof value === 'string' && value.trim() !== '';
}

function isValidCategoryId(value) {
	return Number.isInteger(value) && value > 0;
}

function isValidTime(value) {
	return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
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
	validateHabitProgress,
	validateProgressRange,
};
