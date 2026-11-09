const habitsRepository = require('./habits.repository');
const categoriesRepository = require('../categories/categories.repository');
const { getTodayInBogota, addDaysToDate } = require('../../utils/dates');
const { appliesOnDate, daysToMask } = require('../../utils/habit-days');
const { computeStreaks } = require('../../utils/habit-streaks');

// Se puede registrar hoy y hasta 6 días atrás (7 días en total); nunca en días futuros.
const LOG_WINDOW_DAYS = 7;
const MAX_GOAL_BY_TYPE = { count: 999, duration: 1440 };
const MAX_AMOUNT = 9999;

async function createHabit(userId, habitData) {
	validateUserId(userId);

	const {
		name,
		frequency,
		daysMask,
		reminderTime,
		categoryId,
	} = habitData;
	const goal = resolveGoal({ goalType: 'check', goal: null, unit: null }, habitData);

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

	const today = getTodayInBogota();

	return habitsRepository.create({
		userId,
		name,
		frequency,
		daysMask,
		startDate: today,
		reminderTime: reminderTime ?? null,
		...goal,
		status: 'pendiente',
		categoryId: categoryId ?? null,
		today,
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
	const allowedFields = ['name', 'frequency', 'daysMask', 'goalType', 'goal', 'unit', 'categoryId', 'reminderTime'];

	for (const field of allowedFields) {
		if (Object.prototype.hasOwnProperty.call(data, field)) {
			filteredData[field] = data[field];
		}
	}

	if (['goalType', 'goal', 'unit'].some((field) => Object.prototype.hasOwnProperty.call(filteredData, field))) {
		Object.assign(filteredData, resolveGoal(habit, filteredData));
	}

	if (Object.prototype.hasOwnProperty.call(filteredData, 'categoryId')
		&& filteredData.categoryId !== null
		&& filteredData.categoryId !== habit.categoryId) {
		await validateHabitCategory(filteredData.categoryId, userId);
	}
	if (filteredData.reminderTime && !(filteredData.categoryId ?? habit.categoryId)) {
		const error = new Error('El recordatorio requiere una categoría que permita recurrencias');
		error.statusCode = 400;
		throw error;
	}
	if (filteredData.reminderTime
		&& (filteredData.reminderTime !== String(habit.reminderTime || '').slice(0, 5)
			|| (filteredData.categoryId !== undefined && filteredData.categoryId !== habit.categoryId))) {
		await validateHabitCategory(filteredData.categoryId ?? habit.categoryId, userId, true);
	}

	const today = getTodayInBogota();
	const updated = await habitsRepository.update(habitId, userId, filteredData, today);
	const newTarget = targetOf(updated);

	if (newTarget !== targetOf(habit)) {
		await habitsRepository.syncTarget(habitId, userId, today, newTarget);
		return getHabitById(habitId, userId);
	}

	return updated;
}

// Marcar o desmarcar un día (hoy por defecto). Sirve para todos los tipos: "completado" lleva el
// avance a la meta y "pendiente" lo borra.
async function changeStatus(habitId, userId, status, date) {
	const habit = await getHabitById(habitId, userId);
	const today = getTodayInBogota();
	const day = date ?? today;

	validateLogDate(habit, day, today);

	if (status === 'completado') {
		await habitsRepository.markCompleted(habitId, userId, day, targetOf(habit));
	} else {
		await habitsRepository.deleteProgress(habitId, userId, day);
	}

	return withProgress(habitId, userId, day);
}

// Avance de un día en hábitos de cantidad o tiempo: amount fija el valor (0 = deshacer) y delta suma.
async function updateProgress(habitId, userId, { date, amount, delta }) {
	const habit = await getHabitById(habitId, userId);
	const today = getTodayInBogota();
	const day = date ?? today;

	if (habit.goalType === 'check') {
		const error = new Error('Los hábitos de solo marcar se registran con el estado (pendiente o completado)');
		error.statusCode = 400;
		throw error;
	}

	validateLogDate(habit, day, today);

	if (amount !== null) {
		await habitsRepository.setProgress(habitId, userId, day, amount, targetOf(habit));
	} else {
		await habitsRepository.incrementProgress(habitId, userId, day, delta, targetOf(habit), MAX_AMOUNT);
	}

	return withProgress(habitId, userId, day);
}

async function getProgress(userId, from, to) {
	validateUserId(userId);

	return habitsRepository.findProgressByUserAndRange(userId, from, to);
}

async function getStats(userId) {
	validateUserId(userId);

	const today = getTodayInBogota();
	const [habits, completedDays] = await Promise.all([
		habitsRepository.findAllByUser(userId, today),
		habitsRepository.findCompletedDaysByUser(userId, today),
	]);

	return computeStreaks(
		habits.map((habit) => ({ id: habit.id, daysMask: daysToMask(habit.days), startDate: habit.startDate })),
		completedDays,
		today,
	);
}

async function deleteHabit(habitId, userId) {
	await getHabitById(habitId, userId);

	await habitsRepository.softDelete(habitId, userId);
}

async function withProgress(habitId, userId, date) {
	const [habit, progress] = await Promise.all([
		getHabitById(habitId, userId),
		habitsRepository.findProgress(habitId, userId, date),
	]);

	return {
		...habit,
		progress: progress ?? { date, amount: 0, target: targetOf(habit), completed: false, completedAt: null },
	};
}

/**
 * Tipo, meta y unidad finales a partir de los actuales (current) y los que llegan (changes).
 * Sin goalType, la meta decide como en la migración (clientes anteriores): mayor que 1 es
 * cantidad y si no, solo marcar. Solo marcar no lleva meta ni unidad; tiempo no lleva unidad.
 */
function resolveGoal(current, changes) {
	const has = (field) => Object.prototype.hasOwnProperty.call(changes, field) && changes[field] !== undefined;
	const goal = has('goal') ? changes.goal : current.goal;
	const unit = has('unit') ? changes.unit : current.unit;
	let goalType = has('goalType') ? changes.goalType : current.goalType;

	if (!has('goalType') && has('goal')) {
		goalType = goal > 1 ? 'count' : 'check';
	}

	if (goalType === 'check') {
		return { goalType, goal: null, unit: null };
	}

	const maxGoal = MAX_GOAL_BY_TYPE[goalType];
	if (!Number.isInteger(goal) || goal < 1 || goal > maxGoal) {
		const error = new Error(goalType === 'count'
			? `La meta diaria de cantidad es obligatoria y debe estar entre 1 y ${maxGoal}`
			: `La meta diaria de tiempo es obligatoria y debe estar entre 1 y ${maxGoal} minutos`);
		error.statusCode = 400;
		throw error;
	}

	return { goalType, goal, unit: goalType === 'count' ? unit ?? null : null };
}

function targetOf(habit) {
	return habit.goalType === 'check' ? 1 : habit.goal ?? 1;
}

// today se recibe (en vez de calcularse aquí) para poder probar la regla con fechas fijas.
function validateLogDate(habit, date, today) {
	let message = null;

	if (date > today) {
		message = 'No se puede registrar en días futuros';
	} else if (date < addDaysToDate(today, -(LOG_WINDOW_DAYS - 1))) {
		message = `Solo puedes registrar hasta ${LOG_WINDOW_DAYS - 1} días atrás`;
	} else if (date < habit.startDate) {
		message = 'El hábito todavía no existía ese día';
	} else if (!appliesOnDate(daysToMask(habit.days), date)) {
		message = 'Este hábito no aplica ese día';
	}

	if (message) {
		const error = new Error(message);
		error.statusCode = 400;
		throw error;
	}
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

module.exports = {
	createHabit,
	getHabits,
	getHabitById,
	updateHabit,
	changeStatus,
	updateProgress,
	getProgress,
	getStats,
	deleteHabit,
	resolveGoal,
	validateLogDate,
};
