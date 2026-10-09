const categoriesRepository = require('../categories/categories.repository');
const recurrencesRepository = require('./recurrences.repository');

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
	const reminders = await recurrencesRepository.findRemindersByUser(userId);
	return reminders.find((reminder) => reminder.recurrenceId === recurrenceId);
}

async function getReminders(userId) {
	validateUserId(userId);
	const today = dateInTimeZone(new Date(), 'America/Bogota');
	return (await recurrencesRepository.findRemindersByUser(userId)).map((reminder) => ({
		...reminder,
		isOverdue: reminder.scheduledDate < today,
		isDueToday: reminder.scheduledDate === today,
	}));
}

async function confirmOccurrence(occurrenceId, userId, paidDate) {
	validateUserId(userId);
	if (!Number.isInteger(occurrenceId) || occurrenceId <= 0) {
		throw badRequestError('El identificador del recordatorio no es válido');
	}
	return recurrencesRepository.confirmOccurrence(
		occurrenceId,
		userId,
		paidDate || dateInTimeZone(new Date(), 'America/Bogota'),
	);
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
		dateInTimeZone(new Date(), 'America/Bogota'),
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

function dateInTimeZone(date, timeZone) {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(date);
	const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
	return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function badRequestError(message) {
	const error = new Error(message);
	error.statusCode = 400;
	return error;
}

module.exports = {
	createRecurrence,
	getReminders,
	confirmOccurrence,
	cancelRecurrence,
};
