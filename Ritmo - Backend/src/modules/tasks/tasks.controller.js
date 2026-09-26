const tasksService = require('./tasks.service');

async function create(req, res, next) {
	try {
		const task = await tasksService.create(req.user.id, req.body);

		return res.status(201).json(task);
	} catch (error) {
		return next(error);
	}
}

async function getTasks(req, res, next) {
	try {
		const tasks = await tasksService.getTasks(req.user.id);

		return res.status(200).json({ data: tasks });
	} catch (error) {
		return next(error);
	}
}

async function getTaskById(req, res, next) {
	try {
		const taskId = Number(req.params.id);
		const task = await tasksService.getTaskById(taskId, req.user.id);

		return res.status(200).json({ data: task });
	} catch (error) {
		return next(error);
	}
}

async function updateTask(req, res, next) {
	try {
		const taskId = Number(req.params.id);
		const task = await tasksService.updateTask(taskId, req.user.id, req.body);

		return res.status(200).json({ data: task });
	} catch (error) {
		return next(error);
	}
}

async function changeStatus(req, res, next) {
	try {
		const taskId = Number(req.params.id);
		const task = await tasksService.changeStatus(taskId, req.user.id, req.body.status);

		return res.status(200).json({ data: task });
	} catch (error) {
		return next(error);
	}
}

async function deleteTask(req, res, next) {
	try {
		const taskId = Number(req.params.id);
		await tasksService.deleteTask(taskId, req.user.id);

		return res.status(200).json({ message: 'Tarea eliminada correctamente' });
	} catch (error) {
		return next(error);
	}
}

module.exports = {
	create,
	getTasks,
	getTaskById,
	updateTask,
	changeStatus,
	deleteTask,
};