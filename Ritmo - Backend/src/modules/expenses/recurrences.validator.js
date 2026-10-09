const frequencies = new Set(['daily', 'weekly', 'monthly', 'yearly']);

function validateCreateRecurrence(req, res, next) {
	const {
		concept,
		categoryId,
		amount,
		frequency,
		startDate,
		notes,
	} = req.body || {};

	if (typeof concept !== 'string' || concept.trim() === '' || concept.trim().length > 100) {
		return next(badRequestError('El concepto es obligatorio y no puede superar los 100 caracteres'));
	}
	if (!Number.isInteger(categoryId) || categoryId <= 0) {
		return next(badRequestError('categoryId debe ser un entero positivo'));
	}
	if (typeof amount !== 'number' || !Number.isFinite(amount) || amount === 0) {
		return next(badRequestError('El monto debe ser un número diferente de cero'));
	}
	if (!hasAtMostTwoDecimals(amount)) {
		return next(badRequestError('El monto debe tener máximo dos decimales'));
	}
	if (!frequencies.has(frequency)) {
		return next(badRequestError('La frecuencia debe ser daily, weekly, monthly o yearly'));
	}
	if (!isValidDateOnly(startDate)) {
		return next(badRequestError('La fecha inicial debe tener formato YYYY-MM-DD y ser válida'));
	}
	if (notes !== undefined && notes !== null && typeof notes !== 'string') {
		return next(badRequestError('Las notas deben ser un texto'));
	}

	req.body = {
		concept: concept.trim(),
		categoryId,
		amount,
		frequency,
		startDate,
		notes: notes === undefined || notes === null ? null : notes.trim(),
	};
	return next();
}

function validateConfirmOccurrence(req, res, next) {
	const { paidDate } = req.body || {};
	if (paidDate !== undefined && !isValidDateOnly(paidDate)) {
		return next(badRequestError('paidDate debe tener formato YYYY-MM-DD y ser válida'));
	}
	if (paidDate !== undefined && paidDate > todayInTimeZone()) {
		return next(badRequestError('paidDate no puede ser una fecha futura'));
	}
	return next();
}

function validateOccurrenceId(req, res, next) {
	if (!isPositiveIntegerId(req.params.occurrenceId)) {
		return next(badRequestError('El identificador del recordatorio no es válido'));
	}
	return next();
}

function validateCancelRecurrence(req, res, next) {
	if (!isPositiveIntegerId(req.params.id)) {
		return next(badRequestError('El identificador de la recurrencia no es válido'));
	}
	if (!['future', 'all'].includes(req.query.scope)) {
		return next(badRequestError('scope debe ser future o all'));
	}
	return next();
}

function isPositiveIntegerId(value) {
	return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function isValidDateOnly(value) {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const [year, month, day] = value.split('-').map(Number);
	return month >= 1 && month <= 12
		&& day >= 1
		&& day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function hasAtMostTwoDecimals(amount) {
	const cents = amount * 100;
	return Math.abs(cents - Math.round(cents)) <= Number.EPSILON * Math.max(1, Math.abs(cents)) * 4;
}

function todayInTimeZone() {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'America/Bogota',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(new Date());
	const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
	return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function badRequestError(message) {
	const error = new Error(message);
	error.statusCode = 400;
	return error;
}

module.exports = {
	validateCreateRecurrence,
	validateConfirmOccurrence,
	validateOccurrenceId,
	validateCancelRecurrence,
};
