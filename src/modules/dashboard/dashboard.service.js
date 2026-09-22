const tasksRepository = require('../tasks/tasks.repository');
const habitsRepository = require('../habits/habits.repository');
const eventsRepository = require('../events/events.repository');
const expensesRepository = require('../expenses/expenses.repository');

async function getDashboard(userId) {
	validateUserId(userId);

	const [todayStats, upcomingTasks, pendingHabits, upcomingEvents, recentExpenses] = await Promise.all([
		tasksRepository.findTodayStatsByUser(userId),
		tasksRepository.findUpcomingByUser(userId),
		habitsRepository.findPendingTodayByUser(userId),
		eventsRepository.findUpcomingByUser(userId),
		expensesRepository.findRecentByUser(userId),
	]);

	const completed = Number(todayStats.completed);
	const total = Number(todayStats.total);
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
			percentage,
		},
		upcoming: [...habits, ...datedItems],
	};
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
};
