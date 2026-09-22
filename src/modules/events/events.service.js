const eventsRepository = require('./events.repository');

async function createEvent(userId, eventData) {
	validateUserId(userId);

	const {
		title,
		description,
		event_date: eventDate,
		location,
		event_time: eventTime,
		duration,
	} = eventData || {};

	validateTitle(title, true);
	validateDate(eventDate, true);
	validateTime(eventTime, true);
	validateDuration(duration, true);
	validateOptionalText(description, 'La descripción');
	validateOptionalText(location, 'La ubicación');

	return eventsRepository.create({
		userId,
		title: title.trim(),
		description: description ?? null,
		eventDate: eventDate.trim(),
		location: location ?? null,
		status: 'programado',
		eventTime: eventTime.trim(),
		duration,
	});
}

async function getEvents(userId) {
	validateUserId(userId);

	return eventsRepository.findAllByUser(userId);
}

async function getEventById(eventId, userId) {
	validateIds(eventId, userId);

	const event = await eventsRepository.findByIdAndUser(eventId, userId);

	if (!event) {
		throw notFoundError();
	}

	return event;
}

async function updateEvent(eventId, userId, eventData) {
	validateIds(eventId, userId);

	const data = eventData || {};
	const fields = {};

	if (Object.prototype.hasOwnProperty.call(data, 'title')) {
		validateTitle(data.title, false);
		fields.title = data.title.trim();
	}

	if (Object.prototype.hasOwnProperty.call(data, 'description')) {
		validateOptionalText(data.description, 'La descripción');
		fields.description = data.description;
	}

	if (Object.prototype.hasOwnProperty.call(data, 'event_date')) {
		validateDate(data.event_date, false);
		fields.eventDate = data.event_date.trim();
	}

	if (Object.prototype.hasOwnProperty.call(data, 'event_time')) {
		validateTime(data.event_time, false);
		fields.eventTime = data.event_time.trim();
	}

	if (Object.prototype.hasOwnProperty.call(data, 'location')) {
		validateOptionalText(data.location, 'La ubicación');
		fields.location = data.location;
	}

	if (Object.prototype.hasOwnProperty.call(data, 'duration')) {
		validateDuration(data.duration, false);
		fields.duration = data.duration;
	}

	const affectedRows = await eventsRepository.update(eventId, userId, fields);

	if (affectedRows === 0) {
		throw notFoundError();
	}

	return getEventById(eventId, userId);
}

async function deleteEvent(eventId, userId) {
	validateIds(eventId, userId);

	const affectedRows = await eventsRepository.softDelete(eventId, userId);

	if (affectedRows === 0) {
		throw notFoundError();
	}
}

function validateUserId(userId) {
	if (!Number.isInteger(userId) || userId <= 0) {
		const error = new Error('El usuario autenticado no es válido');
		error.statusCode = 401;
		throw error;
	}
}

function validateIds(eventId, userId) {
	if (!Number.isInteger(eventId) || eventId <= 0 || !Number.isInteger(userId) || userId <= 0) {
		const error = new Error('Los identificadores de evento y usuario no son válidos');
		error.statusCode = 400;
		throw error;
	}
}

function validateTitle(value, required) {
	if (typeof value !== 'string' || value.trim() === '') {
		if (required) {
			throw badRequestError('El título es obligatorio');
		}

		throw badRequestError('El título debe ser un texto no vacío');
	}
}

function validateDate(value, required) {
	if (typeof value !== 'string' || !isValidDateOnly(value)) {
		const message = required
			? 'La fecha del evento es obligatoria y debe tener formato YYYY-MM-DD'
			: 'La fecha del evento debe tener formato YYYY-MM-DD y ser válida';
		throw badRequestError(message);
	}
}

function validateTime(value, required) {
	if (typeof value !== 'string' || !isValidTime(value)) {
		const message = required
			? 'La hora del evento es obligatoria y debe tener formato HH:mm o HH:mm:ss'
			: 'La hora del evento debe tener formato HH:mm o HH:mm:ss y ser válida';
		throw badRequestError(message);
	}
}

function validateDuration(value, required) {
	if (!Number.isInteger(value) || value <= 0 || value > 1440) {
		const message = required
			? 'La duración es obligatoria y debe ser un entero entre 1 y 1440 minutos'
			: 'La duración debe ser un entero entre 1 y 1440 minutos';
		throw badRequestError(message);
	}
}

function validateOptionalText(value, fieldName) {
	if (value !== undefined && value !== null && typeof value !== 'string') {
		throw badRequestError(`${fieldName} debe ser un texto`);
	}
}

function isValidDateOnly(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
		return false;
	}

	const [year, month, day] = value.split('-').map(Number);
	const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

	return month >= 1 && month <= 12 && day >= 1 && day <= lastDayOfMonth;
}

function isValidTime(value) {
	if (!/^\d{2}:\d{2}(?::\d{2})?$/.test(value)) {
		return false;
	}

	const [hours, minutes, seconds = 0] = value.split(':').map(Number);

	return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59;
}

function badRequestError(message) {
	const error = new Error(message);
	error.statusCode = 400;
	return error;
}

function notFoundError() {
	const error = new Error('Evento no encontrado');
	error.statusCode = 404;
	return error;
}

module.exports = {
	createEvent,
	getEvents,
	getEventById,
	updateEvent,
	deleteEvent,
};
