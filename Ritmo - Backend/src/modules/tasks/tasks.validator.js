const allowedPriorities = new Set(['alta', 'media', 'baja']);
// Coincide con tasks.title VARCHAR(45); el mismo límite aplica al crear y al editar.
const MAX_TITLE_LENGTH = 45;
const MAX_DESCRIPTION_LENGTH = 2000;

function validateCreateTask(req, res, next) {
	const {
		title,
		description,
		date,
		duration,
		priority,
		categoryId,
		recurrenceFrequency,
		start_at: startAt,
		end_at: endAt,
	} = req.body || {};

	if (typeof title !== 'string' || title.trim() === '') {
		const error = new Error('El título es obligatorio');
		error.statusCode = 400;
		return next(error);
	}

	if (title.trim().length > MAX_TITLE_LENGTH) {
		const error = new Error(`El título no puede superar los ${MAX_TITLE_LENGTH} caracteres`);
		error.statusCode = 400;
		return next(error);
	}

	if (typeof description !== 'string') {
		const error = new Error('La descripción es obligatoria');
		error.statusCode = 400;
		return next(error);
	}

	if (description.length > MAX_DESCRIPTION_LENGTH) {
		const error = new Error(`La descripción no puede superar los ${MAX_DESCRIPTION_LENGTH} caracteres`);
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

	const normalizedPriority = typeof priority === 'string' ? priority.trim().toLowerCase() : '';
	if (priority !== undefined && !allowedPriorities.has(normalizedPriority)) {
		const error = new Error('La prioridad debe ser alta, media o baja');
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

	if (categoryId !== undefined && categoryId !== null && !isValidCategoryId(categoryId)) {
		const error = new Error('categoryId debe ser un entero positivo');
		error.statusCode = 400;
		return next(error);
	}
	if (recurrenceFrequency !== undefined && recurrenceFrequency !== null
		&& !isValidRecurrenceFrequency(recurrenceFrequency)) {
		const error = new Error('La frecuencia debe ser daily, weekly, monthly o yearly');
		error.statusCode = 400;
		return next(error);
	}

	req.body.title = title.trim();
	req.body.description = description.trim();
	req.body.date = date.trim();
	req.body.duration = duration === undefined || duration === null ? null : duration;
	req.body.priority = normalizedPriority || 'media';
	req.body.start_at = startAt === undefined || startAt === null ? null : startAt;
	req.body.end_at = endAt === undefined || endAt === null ? null : endAt;
	req.body.categoryId = categoryId ?? null;
	req.body.recurrenceFrequency = recurrenceFrequency ?? null;

	return next();
}

function validateUpdateTask(req, res, next) {
	const body = req.body || {};
	const {
		title, description, priority, categoryId, recurrenceFrequency,
		start_at: startAt, end_at: endAt,
	} = body;
	// Se acepta "date" (el nombre que usa el POST) además de "due_date".
	const dueDate = body.due_date !== undefined ? body.due_date : body.date;
	const updateData = {};

	if (title !== undefined) {
		if (typeof title !== 'string' || title.trim() === '') {
			const error = new Error('El título debe ser un texto no vacío');
			error.statusCode = 400;
			return next(error);
		}

		if (title.trim().length > MAX_TITLE_LENGTH) {
			const error = new Error(`El título no puede superar los ${MAX_TITLE_LENGTH} caracteres`);
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

		if (description.length > MAX_DESCRIPTION_LENGTH) {
			const error = new Error(`La descripción no puede superar los ${MAX_DESCRIPTION_LENGTH} caracteres`);
			error.statusCode = 400;
			return next(error);
		}

		updateData.description = description.trim();
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

		updateData.priority = normalizedPriority;
	}

	if (categoryId !== undefined) {
		if (categoryId !== null && !isValidCategoryId(categoryId)) {
			const error = new Error('categoryId debe ser un entero positivo');
			error.statusCode = 400;
			return next(error);
		}

		updateData.categoryId = categoryId;
	}

	// Cada campo se valida por separado: la recurrencia ya no depende de que llegue categoryId.
	if (recurrenceFrequency !== undefined) {
		if (recurrenceFrequency !== null && !isValidRecurrenceFrequency(recurrenceFrequency)) {
			const error = new Error('La frecuencia debe ser daily, weekly, monthly o yearly');
			error.statusCode = 400;
			return next(error);
		}

		updateData.recurrenceFrequency = recurrenceFrequency;
	}

	if (startAt !== undefined) {
		if (startAt !== null && !isValidDateTime(startAt)) {
			const error = new Error('La fecha de inicio debe tener una fecha y hora válidas');
			error.statusCode = 400;
			return next(error);
		}

		updateData.start_at = startAt;
	}

	if (endAt !== undefined) {
		if (endAt !== null && !isValidDateTime(endAt)) {
			const error = new Error('La fecha de finalización debe tener una fecha y hora válidas');
			error.statusCode = 400;
			return next(error);
		}

		updateData.end_at = endAt;
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

	const normalizedStatus = typeof status === 'string' ? status.trim().toLowerCase() : '';
	if (!allowedStatuses.has(normalizedStatus)) {
		const error = new Error('El estado debe ser pendiente, en_proceso o completada');
		error.statusCode = 400;
		return next(error);
	}

	req.body.status = normalizedStatus;
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

function isValidCategoryId(value) {
	return Number.isInteger(value) && value > 0;
}

function isValidRecurrenceFrequency(value) {
	return ['daily', 'weekly', 'monthly', 'yearly'].includes(value);
}

module.exports = {
	validateCreateTask,
	validateUpdateTask,
	validateTaskStatus,
};