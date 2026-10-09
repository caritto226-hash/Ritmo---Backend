const habitsRepository = require('./habits.repository');
const categoriesRepository = require('../categories/categories.repository');

async function createHabit(userId, habitData) {
	validateUserId(userId);

	const {
		name,
		frequency,
		reminderTime,
		goal,
		categoryId,
	} = habitData;

	if (reminderTime) {
		if (!categoryId) {
			const error = new Error('El recordatorio requiere una categoría que permita recurrencias');
			error.statusCode = 400;
			throw error;
		}
		await validateHabitCategory(categoryId, userId, true);
	}
	if (categoryId !== undefined && categoryId !== null && !reminderTime) {
		await validateHabitCategory(categoryId, userId);
	}

	return habitsRepository.create({
		userId,
		name,
		frequency,
		reminderTime: reminderTime ?? null,
		goal: goal ?? null,
		status: 'pendiente',
		categoryId: categoryId ?? null,
		today: getTodayInBogota(),
	});
}

async function getHabits(userId) {
	validateUserId(userId);

	return habitsRepository.findAllByUser(userId, getTodayInBogota());
}

async function getHabitById(habitId, userId) {
	validateIds(habitId, userId);

	const habit = await habitsRepository.findByIdAndUser(habitId, userId, getTodayInBogota());

	if (!habit) {
		const error = new Error('Hábito no encontrado');
		error.statusCode = 404;
		throw error;
	}

	return habit;
}

async function updateHabit(habitId, userId, data) {
	const habit = await getHabitById(habitId, userId);

	const filteredData = {};
	const allowedFields = ['name', 'frequency', 'goal', 'categoryId', 'reminderTime'];

	for (const field of allowedFields) {
		if (Object.prototype.hasOwnProperty.call(data, field)) {
			filteredData[field] = data[field];
		}
	}

	if (Object.prototype.hasOwnProperty.call(filteredData, 'categoryId')
		&& filteredData.categoryId !== null
		&& filteredData.categoryId !== habit.categoryId) {
		await validateHabitCategory(filteredData.categoryId, userId);
	}
	if (filteredData.reminderTime
		&& (filteredData.reminderTime !== String(habit.reminderTime || '').slice(0, 5)
			|| (filteredData.categoryId !== undefined && filteredData.categoryId !== habit.categoryId))) {
		await validateHabitCategory(filteredData.categoryId ?? habit.categoryId, userId, true);
	}

	return habitsRepository.update(habitId, userId, filteredData, getTodayInBogota());
}

async function changeStatus(habitId, userId, status) {
	await getHabitById(habitId, userId);

	await habitsRepository.updateStatus(habitId, userId, status, getTodayInBogota());

	return getHabitById(habitId, userId);
}

async function deleteHabit(habitId, userId) {
	await getHabitById(habitId, userId);

	await habitsRepository.softDelete(habitId, userId);
}

async function validateHabitCategory(categoryId, userId, requireRecurrence = false) {
	const category = await categoriesRepository.findByIdAndUser(categoryId, userId);
	if (!category || category.module !== 'habits') {
		const error = new Error('Categoría de hábito no encontrada');
		error.statusCode = 404;
		throw error;
	}
	if (requireRecurrence && !category.isRecurring) {
		const error = new Error('La categoría seleccionada no permite recordatorios adicionales');
		error.statusCode = 400;
		throw error;
	}
	return category;
}

function validateUserId(userId) {
	if (!Number.isInteger(userId) || userId <= 0) {
		const error = new Error('El usuario autenticado no es válido');
		error.statusCode = 401;
		throw error;
	}
}

function validateIds(habitId, userId) {
	if (!Number.isInteger(habitId) || habitId <= 0 || !Number.isInteger(userId) || userId <= 0) {
		const error = new Error('Los identificadores de hábito y usuario no son válidos');
		error.statusCode = 400;
		throw error;
	}
}

function getTodayInBogota() {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'America/Bogota',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(new Date());
	const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

	return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

module.exports = {
	createHabit,
	getHabits,
	getHabitById,
	updateHabit,
	changeStatus,
	deleteHabit,
};