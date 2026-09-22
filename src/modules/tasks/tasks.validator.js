const allowedPriorities = new Set(['Alta', 'Media', 'Baja']);

function validateCreateTask(req, res, next) {
	const {
		title,
		description,
		date,
		duration,
		priority,
		start_at: startAt,
		end_at: endAt,
	} = req.body || {};

	if (typeof title !== 'string' || title.trim() === '') {
		const error = new Error('El título es obligatorio');
		error.statusCode = 400;
		return next(error);
	}

	if (title.trim().length > 45) {
		const error = new Error('El título no puede superar los 45 caracteres');
		error.statusCode = 400;
		return next(error);
	}

	if (typeof description !== 'string') {
		const error = new Error('La descripción es obligatoria');
		error.statusCode = 400;
		return next(error);
	}

	if (description.length > 2000) {
		const error = new Error('La descripción no puede superar los 2000 caracteres');
		error.statusCode = 400;
		return next(error);
	}

	if (typeof date !== 'string' || !isValidDateOnly(date)) {
		const error = new Error('La fecha es obligatoria y debe tener formato YYYY-MM-DD');
		error.statusCode = 400;
		return next(error);
	}

	if (duration !== undefined && duration !== null && (!Number.isInteger(duration) || duration <= 0 || duration > 1440)) {
		const error = new Error('La duración debe ser un entero entre 1 y 1440 minutos');
		error.statusCode = 400;
		return next(error);
	}

	if (priority !== undefined && !allowedPriorities.has(priority)) {
		const error = new Error('La prioridad debe ser Alta, Media o Baja');
		error.statusCode = 400;
		return next(error);
	}

	if (startAt !== undefined && startAt !== null && !isValidDateTime(startAt)) {
		const error = new Error('La fecha de inicio debe tener una fecha y hora válidas');
		error.statusCode = 400;
		return next(error);
	}

	if (endAt !== undefined && endAt !== null && !isValidDateTime(endAt)) {
		const error = new Error('La fecha de finalización debe tener una fecha y hora válidas');
		error.statusCode = 400;
		return next(error);
	}

	req.body.title = title.trim();
	req.body.description = description.trim();
	req.body.date = date.trim();
	req.body.duration = duration === undefined || duration === null ? null : duration;
	req.body.priority = priority || 'Media';
	req.body.start_at = startAt === undefined || startAt === null ? null : startAt;
	req.body.end_at = endAt === undefined || endAt === null ? null : endAt;

	return next();
}

function validateUpdateTask(req, res, next) {
	const { title, description, due_date: dueDate, priority } = req.body || {};
	const updateData = {};

	if (title !== undefined) {
		if (typeof title !== 'string' || title.trim() === '') {
			const error = new Error('El título debe ser un texto no vacío');
			error.statusCode = 400;
			return next(error);
		}

		if (title.trim().length > 150) {
			const error = new Error('El título no puede superar los 150 caracteres');
			error.statusCode = 400;
			return next(error);
		}

		updateData.title = title.trim();
	}

	if (description !== undefined) {
		if (typeof description !== 'string') {
			const error = new Error('La descripción debe ser un texto');
			error.statusCode = 400;
			return next(error);
		}

		updateData.description = description;
	}

	if (dueDate !== undefined) {
		if (!isValidDateOnly(dueDate)) {
			const error = new Error('La fecha límite debe tener formato YYYY-MM-DD y ser válida');
			error.statusCode = 400;
			return next(error);
		}

		updateData.due_date = dueDate.trim();
	}

	if (priority !== undefined) {
		const normalizedPriority = typeof priority === 'string' ? priority.trim().toLowerCase() : '';
		const allowedUpdatePriorities = new Set(['baja', 'media', 'alta']);

		if (!allowedUpdatePriorities.has(normalizedPriority)) {
			const error = new Error('La prioridad debe ser baja, media o alta');
			error.statusCode = 400;
			return next(error);
		}

		updateData.priority = normalizedPriority.charAt(0).toUpperCase() + normalizedPriority.slice(1);
	}

	if (Object.keys(updateData).length === 0) {
		const error = new Error('Debe proporcionar al menos un campo válido para actualizar');
		error.statusCode = 400;
		return next(error);
	}

	req.body = updateData;
	return next();
}

function validateTaskStatus(req, res, next) {
	const allowedStatuses = new Set(['pendiente', 'en_proceso', 'completada']);
	const { status } = req.body || {};

	if (typeof status !== 'string' || !allowedStatuses.has(status)) {
		const error = new Error('El estado debe ser pendiente, en_proceso o completada');
		error.statusCode = 400;
		return next(error);
	}

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

function isValidDateTime(value) {
	const dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;

	if (typeof value !== 'string' || !dateTimePattern.test(value) || !isValidDateOnly(value.slice(0, 10))) {
		return false;
	}

	const date = new Date(`${value}Z`);
	return !Number.isNaN(date.getTime());
}

module.exports = {
	validateCreateTask,
	validateUpdateTask,
	validateTaskStatus,
};