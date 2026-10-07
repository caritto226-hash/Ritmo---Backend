const tasksRepository = require('../tasks/tasks.repository');
const habitsRepository = require('../habits/habits.repository');
const eventsRepository = require('../events/events.repository');
const expensesRepository = require('../expenses/expenses.repository');

async function getDashboard(userId) {
	validateUserId(userId);
	const today = getDateInTimeZone(new Date(), 'America/Bogota');

	const [todayTaskStats, todayHabitStats, upcomingTasks, pendingHabits, upcomingEvents, recentExpenses] = await Promise.all([
		tasksRepository.findTodayStatsByUser(userId, today),
		habitsRepository.findTodayStatsByUser(userId),
		tasksRepository.findUpcomingByUser(userId, today),
		habitsRepository.findPendingTodayByUser(userId),
		eventsRepository.findUpcomingByUser(userId),
		expensesRepository.findRecentByUser(userId),
	]);

	const completed = Number(todayTaskStats.completed) + Number(todayHabitStats.completed);
	const total = Number(todayTaskStats.total) + Number(todayHabitStats.total);
	const pending = total - completed;
	const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

	const datedItems = [
		...upcomingTasks.map((task) => ({
			...task,
			type: 'task',
			date: task.dueDate,
		})),
		...upcomingEvents.map((event) => ({
			...event,
			type: 'event',
			date: event.eventDate,
		})),
		...recentExpenses.map((expense) => ({
			...expense,
			type: 'expense',
			date: expense.expenseDate,
		})),
	].sort((firstItem, secondItem) => new Date(firstItem.date) - new Date(secondItem.date));

	const habits = pendingHabits.map((habit) => ({
		...habit,
		type: 'habit',
	}));

	return {
		todayRitmo: {
			completed,
			total,
			pending,
			percentage,
			tasks: {
				completed: Number(todayTaskStats.completed),
				total: Number(todayTaskStats.total),
			},
			habits: {
				completed: Number(todayHabitStats.completed),
				total: Number(todayHabitStats.total),
			},
		},
		upcoming: [...habits, ...datedItems],
	};
}

function getDateInTimeZone(date, timeZone) {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(date);
	const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

	return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function validateUserId(userId) {
	if (!Number.isInteger(userId) || userId <= 0) {
		const error = new Error('El usuario autenticado no es válido');
		error.statusCode = 401;
		throw error;
	}
}

module.exports = {
	getDashboard,
	getDateInTimeZone,
};
