// Estados según la regla de negocio; "programado" permite deshacer un cambio hecho por error.
const allowedStatuses = new Set(['programado', 'completado', 'cancelado']);
// Coinciden con events.title VARCHAR(150) y events.location VARCHAR(150).
const MAX_TITLE_LENGTH = 150;
const MAX_LOCATION_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 2000;

function validateCreateEvent(req, res, next) {
	const {
		title,
		description,
		event_date: eventDate,
		location,
		event_time: eventTime,
		duration,
		categoryId,
		recurrenceFrequency,
	} = req.body || {};

	if (typeof title !== 'string' || title.trim() === '') {
		return next(createError('El título es obligatorio'));
	}

	if (title.trim().length > MAX_TITLE_LENGTH) {
		return next(createError(`El título no puede superar los ${MAX_TITLE_LENGTH} caracteres`));
	}

	if (typeof eventDate !== 'string' || !isValidDateOnly(eventDate)) {
		return next(createError('La fecha del evento es obligatoria y debe tener formato YYYY-MM-DD'));
	}

	// Sin hora (null o ausente) el evento es de todo el día.
	if (eventTime !== undefined && eventTime !== null && !isValidTime(eventTime)) {
		return next(createError('La hora del evento debe tener formato HH:mm o HH:mm:ss'));
	}

	// La duración es opcional.
	if (duration !== undefined && duration !== null && !isValidDuration(duration)) {
		return next(createError('La duración debe ser un entero entre 1 y 1440 minutos'));
	}

	if (description !== undefined && description !== null && !isValidOptionalText(description, MAX_DESCRIPTION_LENGTH)) {
		return next(createError(`La descripción debe ser un texto de hasta ${MAX_DESCRIPTION_LENGTH} caracteres`));
	}

	if (location !== undefined && location !== null && !isValidOptionalText(location, MAX_LOCATION_LENGTH)) {
		return next(createError(`La ubicación debe ser un texto de hasta ${MAX_LOCATION_LENGTH} caracteres`));
	}
	if (categoryId !== undefined && categoryId !== null && !isValidId(categoryId)) {
		return next(createError('categoryId debe ser un entero positivo'));
	}
	if (recurrenceFrequency !== undefined && recurrenceFrequency !== null && !isValidRecurrenceFrequency(recurrenceFrequency)) {
		return next(createError('La frecuencia debe ser daily, weekly, monthly o yearly'));
	}

	req.body = {
		title: title.trim(),
		description: description ?? null,
		event_date: eventDate.trim(),
		event_time: eventTime ? eventTime.trim() : null,
		duration: duration ?? null,
		...(location !== undefined && location !== null ? { location } : { location: null }),
		categoryId: categoryId ?? null,
		recurrenceFrequency: recurrenceFrequency ?? null,
	};

	return next();
}

function validateUpdateEvent(req, res, next) {
	const data = req.body || {};
	const updateData = {};

	if (Object.prototype.hasOwnProperty.call(data, 'title')) {
		if (typeof data.title !== 'string' || data.title.trim() === '') {
			return next(createError('El título debe ser un texto no vacío'));
		}

		if (data.title.trim().length > MAX_TITLE_LENGTH) {
			return next(createError(`El título no puede superar los ${MAX_TITLE_LENGTH} caracteres`));
		}

		updateData.title = data.title.trim();
	}

	if (Object.prototype.hasOwnProperty.call(data, 'description')) {
		if (data.description !== null && !isValidOptionalText(data.description, MAX_DESCRIPTION_LENGTH)) {
			return next(createError(`La descripción debe ser un texto de hasta ${MAX_DESCRIPTION_LENGTH} caracteres`));
		}

		updateData.description = data.description;
	}

	if (Object.prototype.hasOwnProperty.call(data, 'event_date')) {
		if (typeof data.event_date !== 'string' || !isValidDateOnly(data.event_date)) {
			return next(createError('La fecha del evento debe tener formato YYYY-MM-DD y ser válida'));
		}

		updateData.event_date = data.event_date.trim();
	}

	if (Object.prototype.hasOwnProperty.call(data, 'event_time')) {
		// null convierte el evento en uno de todo el día.
		if (data.event_time !== null && !isValidTime(data.event_time)) {
			return next(createError('La hora del evento debe tener formato HH:mm o HH:mm:ss y ser válida'));
		}

		updateData.event_time = data.event_time === null ? null : data.event_time.trim();
	}

	if (Object.prototype.hasOwnProperty.call(data, 'duration')) {
		if (data.duration !== null && !isValidDuration(data.duration)) {
			return next(createError('La duración debe ser un entero entre 1 y 1440 minutos'));
		}

		updateData.duration = data.duration;
	}

	if (Object.prototype.hasOwnProperty.call(data, 'location')) {
		if (data.location !== null && !isValidOptionalText(data.location, MAX_LOCATION_LENGTH)) {
			return next(createError(`La ubicación debe ser un texto de hasta ${MAX_LOCATION_LENGTH} caracteres`));
		}
		updateData.location = data.location;
	}

	if (Object.prototype.hasOwnProperty.call(data, 'categoryId')) {
		if (data.categoryId !== null && !isValidId(data.categoryId)) {
			return next(createError('categoryId debe ser un entero positivo'));
		}
		updateData.categoryId = data.categoryId;
	}

	if (Object.prototype.hasOwnProperty.call(data, 'recurrenceFrequency')) {
		if (data.recurrenceFrequency !== null && !isValidRecurrenceFrequency(data.recurrenceFrequency)) {
			return next(createError('La frecuencia debe ser daily, weekly, monthly o yearly'));
		}
		updateData.recurrenceFrequency = data.recurrenceFrequency;
	}

	if (Object.keys(updateData).length === 0) {
		return next(createError('Debe proporcionar al menos un campo válido para actualizar'));
	}

	req.body = updateData;
	return next();
}

function validateEventStatus(req, res, next) {
	const { status } = req.body || {};
	const normalizedStatus = typeof status === 'string' ? status.trim().toLowerCase() : '';

	if (!allowedStatuses.has(normalizedStatus)) {
		return next(createError('El estado debe ser programado, completado o cancelado'));
	}

	req.body.status = normalizedStatus;
	return next();
}

function isValidOptionalText(value, maxLength) {
	return typeof value === 'string' && value.length <= maxLength;
}

function isValidId(value) {
	return Number.isInteger(value) && value > 0;
}

function isValidRecurrenceFrequency(value) {
	return ['daily', 'weekly', 'monthly', 'yearly'].includes(value);
}

function isValidDateOnly(value) {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return false;
	}

	const [year, month, day] = value.split('-').map(Number);
	const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

	return month >= 1 && month <= 12 && day >= 1 && day <= lastDayOfMonth;
}

function isValidDuration(value) {
	return Number.isInteger(value) && value > 0 && value <= 1440;
}

function isValidTime(value) {
	if (typeof value !== 'string' || !/^\d{2}:\d{2}(?::\d{2})?$/.test(value)) {
		return false;
	}

	const [hours, minutes, seconds = 0] = value.split(':').map(Number);

	return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59;
}

function createError(message) {
	const error = new Error(message);
	error.statusCode = 400;
	return error;
}

module.exports = {
	validateCreateEvent,
	validateUpdateEvent,
	validateEventStatus,
};
