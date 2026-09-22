const habitsService = require('./habits.service');

async function createHabit(req, res, next) {
	try {
		const habit = await habitsService.createHabit(req.user.id, req.body);

		return res.status(201).json(habit);
	} catch (error) {
		return next(error);
	}
}

async function getHabits(req, res, next) {
	try {
		const habits = await habitsService.getHabits(req.user.id);

		return res.status(200).json({ data: habits });
	} catch (error) {
		return next(error);
	}
}

async function getHabitById(req, res, next) {
	try {
		const habitId = Number(req.params.id);
		const habit = await habitsService.getHabitById(habitId, req.user.id);

		return res.status(200).json({ data: habit });
	} catch (error) {
		return next(error);
	}
}

async function updateHabit(req, res, next) {
	try {
		const habitId = Number(req.params.id);
		const habit = await habitsService.updateHabit(habitId, req.user.id, req.body);

		return res.status(200).json({ data: habit });
	} catch (error) {
		return next(error);
	}
}

async function changeStatus(req, res, next) {
	try {
		const habitId = Number(req.params.id);
		const habit = await habitsService.changeStatus(habitId, req.user.id, req.body.status);

		return res.status(200).json({ data: habit });
	} catch (error) {
		return next(error);
	}
}

async function deleteHabit(req, res, next) {
	try {
		const habitId = Number(req.params.id);
		await habitsService.deleteHabit(habitId, req.user.id);

		return res.status(200).json({ message: 'Hábito eliminado correctamente' });
	} catch (error) {
		return next(error);
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