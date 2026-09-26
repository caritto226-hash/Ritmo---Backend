const habitsRepository = require('./habits.repository');

async function createHabit(userId, habitData) {
	validateUserId(userId);

	const {
		name,
		frequency,
		goal,
	} = habitData;

	return habitsRepository.create({
		userId,
		name,
		frequency,
		goal: goal ?? null,
		status: 'pendiente',
	});
}

async function getHabits(userId) {
	validateUserId(userId);

	return habitsRepository.findAllByUser(userId);
}

async function getHabitById(habitId, userId) {
	validateIds(habitId, userId);

	const habit = await habitsRepository.findByIdAndUser(habitId, userId);

	if (!habit) {
		const error = new Error('Hábito no encontrado');
		error.statusCode = 404;
		throw error;
	}

	return habit;
}

async function updateHabit(habitId, userId, data) {
	await getHabitById(habitId, userId);

	const filteredData = {};
	const allowedFields = ['name', 'frequency', 'goal'];

	for (const field of allowedFields) {
		if (Object.prototype.hasOwnProperty.call(data, field)) {
			filteredData[field] = data[field];
		}
	}

	return habitsRepository.update(habitId, userId, filteredData);
}

async function changeStatus(habitId, userId, status) {
	await getHabitById(habitId, userId);

	await habitsRepository.updateStatus(habitId, userId, status);

	return getHabitById(habitId, userId);
}

async function deleteHabit(habitId, userId) {
	await getHabitById(habitId, userId);

	await habitsRepository.softDelete(habitId, userId);
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

module.exports = {
	createHabit,
	getHabits,
	getHabitById,
	updateHabit,
	changeStatus,
	deleteHabit,
};