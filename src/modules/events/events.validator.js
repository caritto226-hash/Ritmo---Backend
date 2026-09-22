function validateCreateEvent(req, res, next) {
	const {
		title,
		description,
		event_date: eventDate,
		location,
		event_time: eventTime,
		duration,
	} = req.body || {};

	if (typeof title !== 'string' || title.trim() === '') {
		return next(createError('El título es obligatorio'));
	}

	if (title.trim().length > 150) {
		return next(createError('El título no puede superar los 150 caracteres'));
	}

	if (typeof eventDate !== 'string' || !isValidDateOnly(eventDate)) {
		return next(createError('La fecha del evento es obligatoria y debe tener formato YYYY-MM-DD'));
	}

	if (typeof eventTime !== 'string' || !isValidTime(eventTime)) {
		return next(createError('La hora del evento es obligatoria y debe tener formato HH:mm o HH:mm:ss'));
	}

	if (!Number.isInteger(duration) || duration <= 0 || duration > 1440) {
		return next(createError('La duración es obligatoria y debe ser un entero entre 1 y 1440 minutos'));
	}

	if (description !== undefined && description !== null && typeof description !== 'string') {
		return next(createError('La descripción debe ser un texto'));
	}

	if (location !== undefined && location !== null && typeof location !== 'string') {
		return next(createError('La ubicación debe ser un texto'));
	}

	req.body = {
		title: title.trim(),
		description: description ?? null,
		event_date: eventDate.trim(),
		event_time: eventTime.trim(),
		duration,
		...(location !== undefined && location !== null ? { location } : { location: null }),
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

		if (data.title.trim().length > 150) {
			return next(createError('El título no puede superar los 150 caracteres'));
		}

		updateData.title = data.title.trim();
	}

	if (Object.prototype.hasOwnProperty.call(data, 'description')) {
		if (data.description !== null && typeof data.description !== 'string') {
			return next(createError('La descripción debe ser un texto'));
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
		if (typeof data.event_time !== 'string' || !isValidTime(data.event_time)) {
			return next(createError('La hora del evento debe tener formato HH:mm o HH:mm:ss y ser válida'));
		}

		updateData.event_time = data.event_time.trim();
	}

	if (Object.prototype.hasOwnProperty.call(data, 'duration')) {
		if (!Number.isInteger(data.duration) || data.duration <= 0 || data.duration > 1440) {
			return next(createError('La duración debe ser un entero entre 1 y 1440 minutos'));
		}

		updateData.duration = data.duration;
	}

	if (Object.prototype.hasOwnProperty.call(data, 'location')) {
		if (data.location !== null && typeof data.location !== 'string') {
			return next(createError('La ubicación debe ser un texto'));
		}

		updateData.location = data.location;
	}

	if (Object.keys(updateData).length === 0) {
		return next(createError('Debe proporcionar al menos un campo válido para actualizar'));
	}

	req.body = updateData;
	return next();
}

function isValidDateOnly(value) {
	if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return false;
	}

	const [year, month, day] = value.split('-').map(Number);
	const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

	return month >= 1 && month <= 12 && day >= 1 && day <= lastDayOfMonth;
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
};
