const categoriesRepository = require('../categories/categories.repository');
const recurrencesRepository = require('./recurrences.repository');
const { getTodayInBogota, addDaysToDate } = require('../../utils/dates');

// Días antes de la fecha programada en que un recordatorio se vuelve visible y confirmable.
// Después de esa fecha sigue visible mientras esté pendiente (vencido).
const REMINDER_LEAD_DAYS = {
	daily: 0,
	weekly: 2,
	monthly: 2,
	yearly: 2,
};

function getReminderVisibleFrom(scheduledDate, frequency) {
	return addDaysToDate(scheduledDate, -REMINDER_LEAD_DAYS[frequency]);
}

// Última fecha programada visible hoy para cada frecuencia.
function getReminderVisibleUntil(today) {
	return Object.fromEntries(Object.entries(REMINDER_LEAD_DAYS).map(([frequency, leadDays]) => [
		frequency,
		addDaysToDate(today, leadDays),
	]));
}

async function createRecurrence(userId, data) {
	validateUserId(userId);
	await validateFinanceCategory(data.categoryId, userId);
	const [year, month, day] = data.startDate.split('-').map(Number);

	const recurrenceId = await recurrencesRepository.create({
		...data,
		userId,
		anchorDay: day,
		anchorMonth: month,
	});
	return recurrencesRepository.findRecurrenceByIdAndUser(recurrenceId, userId);
}

async function getRecurrences(userId) {
	validateUserId(userId);
	return recurrencesRepository.findRecurrencesByUser(userId);
}

// Solo cambia los valores con que se registrarán los próximos movimientos (incluido el pendiente actual);
// los movimientos ya registrados guardaron su propia copia y no se tocan.
async function updateRecurrence(recurrenceId, userId, data) {
	validateUserId(userId);
	if (!Number.isInteger(recurrenceId) || recurrenceId <= 0) {
		throw badRequestError('El identificador de la recurrencia no es válido');
	}

	const recurrence = await recurrencesRepository.findRecurrenceByIdAndUser(recurrenceId, userId);
	if (!recurrence) {
		throw httpError('Recurrencia financiera no encontrada', 404);
	}
	if (!recurrence.isActive && recurrence.pendingOccurrenceId === null) {
		throw httpError('Esta recurrencia está detenida y no tiene recordatorios pendientes', 409);
	}
	if (data.categoryId !== undefined && data.categoryId !== recurrence.categoryId) {
		await validateFinanceCategory(data.categoryId, userId);
	}

	await recurrencesRepository.update(recurrenceId, userId, data);
	return recurrencesRepository.findRecurrenceByIdAndUser(recurrenceId, userId);
}

async function getReminders(userId) {
	validateUserId(userId);
	const today = getTodayInBogota();
	const reminders = await recurrencesRepository.findRemindersByUser(
		userId,
		getReminderVisibleUntil(today),
	);
	return reminders.map((reminder) => ({
		...reminder,
		isOverdue: reminder.scheduledDate < today,
		isDueToday: reminder.scheduledDate === today,
		isUpcoming: reminder.scheduledDate > today,
	}));
}

async function confirmOccurrence(occurrenceId, userId, paidDate) {
	validateUserId(userId);
	if (!Number.isInteger(occurrenceId) || occurrenceId <= 0) {
		throw badRequestError('El identificador del recordatorio no es válido');
	}

	const occurrence = await recurrencesRepository.findOccurrenceByIdAndUser(occurrenceId, userId);
	if (!occurrence) {
		throw httpError('Recordatorio financiero no encontrado', 404);
	}
	if (occurrence.status !== 'pending') {
		throw httpError('Este recordatorio ya fue atendido', 409);
	}
	const visibleFrom = getReminderVisibleFrom(occurrence.scheduledDate, occurrence.frequency);
	if (getTodayInBogota() < visibleFrom) {
		throw httpError(`Este recordatorio estará disponible desde el ${visibleFrom}`, 409);
	}

	// El repositorio vuelve a verificar el estado con bloqueo para evitar confirmaciones simultáneas.
	return recurrencesRepository.confirmOccurrence(
		occurrenceId,
		userId,
		paidDate || getTodayInBogota(),
	);
}

async function undoConfirmation(occurrenceId, userId) {
	validateUserId(userId);
	if (!Number.isInteger(occurrenceId) || occurrenceId <= 0) {
		throw badRequestError('El identificador del recordatorio no es válido');
	}

	const occurrence = await recurrencesRepository.findOccurrenceByIdAndUser(occurrenceId, userId);
	if (!occurrence) {
		throw httpError('Recordatorio financiero no encontrado', 404);
	}
	return undoOccurrence(occurrence, userId);
}

// Usado al borrar un movimiento: si vino de una recurrencia vigente, se deshace su confirmación.
// Devuelve false cuando no hay recurrencia vigente y el movimiento se borra como cualquier otro.
async function undoConfirmationByExpense(expenseId, userId) {
	const occurrence = await recurrencesRepository.findOccurrenceByExpense(expenseId, userId);
	if (!occurrence) return false;

	await undoOccurrence(occurrence, userId);
	return true;
}

// Solo se puede deshacer la confirmación más reciente, para que la cadena de fechas no quede con huecos.
async function undoOccurrence(occurrence, userId) {
	if (occurrence.status !== 'confirmed') {
		throw httpError('Este recordatorio no está confirmado', 409);
	}
	const latest = await recurrencesRepository.findLatestConfirmedOccurrence(occurrence.recurrenceId, userId);
	if (latest && latest.occurrenceId !== occurrence.occurrenceId) {
		throw httpError(`Primero deshaz la confirmación del ${latest.scheduledDate}`, 409);
	}

	// El repositorio vuelve a verificar con bloqueo para evitar reversiones o confirmaciones simultáneas.
	return recurrencesRepository.undoConfirmation(occurrence.occurrenceId, occurrence.recurrenceId, userId);
}

async function cancelRecurrence(recurrenceId, userId, scope) {
	validateUserId(userId);
	if (!Number.isInteger(recurrenceId) || recurrenceId <= 0) {
		throw badRequestError('El identificador de la recurrencia no es válido');
	}
	if (!['future', 'all'].includes(scope)) {
		throw badRequestError('El alcance de cancelación no es válido');
	}
	return recurrencesRepository.cancel(
		recurrenceId,
		userId,
		scope,
		getTodayInBogota(),
	);
}

async function validateFinanceCategory(categoryId, userId) {
	const category = await categoriesRepository.findByIdAndUser(categoryId, userId);
	if (!category || category.module !== 'finance' || !category.isActive) {
		const error = new Error('Categoría financiera activa no encontrada');
		error.statusCode = 404;
		throw error;
	}
	if (!category.isRecurring) {
		const error = new Error('La categoría seleccionada no permite recurrencias');
		error.statusCode = 400;
		throw error;
	}
}

function validateUserId(userId) {
	if (!Number.isInteger(userId) || userId <= 0) {
		const error = new Error('El usuario autenticado no es válido');
		error.statusCode = 401;
		throw error;
	}
}

function badRequestError(message) {
	return httpError(message, 400);
}

function httpError(message, statusCode) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

module.exports = {
	createRecurrence,
	getRecurrences,
	updateRecurrence,
	getReminders,
	confirmOccurrence,
	undoConfirmation,
	undoConfirmationByExpense,
	cancelRecurrence,
};
