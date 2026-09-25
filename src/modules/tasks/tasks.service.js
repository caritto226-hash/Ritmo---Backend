const tasksRepository = require('./tasks.repository');

async function create(userId, taskData) {
	if (!Number.isInteger(userId) || userId <= 0) {
		const error = new Error('El usuario autenticado no es válido');
		error.statusCode = 401;
		throw error;
	}

	const {
		title,
		description,
		date,
		start_at: startAt,
		end_at: endAt,
		duration,
		priority,
	} = taskData;

	if (startAt && endAt && new Date(endAt) < new Date(startAt)) {
		const error = new Error('La fecha de finalización no puede ser anterior a la fecha de inicio');
		error.statusCode = 400;
		throw error;
	}

	return tasksRepository.create({
		userId,
		title,
		description,
		dueDate: date,
		duration: duration ?? null,
		startAt: startAt ?? null,
		endAt: endAt ?? null,
		priority: priority || 'media',
		status: 'pendiente',
	});
}

async function getTasks(userId) {
	if (!Number.isInteger(userId) || userId <= 0) {
		const error = new Error('El usuario autenticado no es válido');
		error.statusCode = 401;
		throw error;
	}

	return tasksRepository.findAllByUser(userId);
}

async function getTaskById(taskId, userId) {
	if (!Number.isInteger(taskId) || taskId <= 0 || !Number.isInteger(userId) || userId <= 0) {
		const error = new Error('Los identificadores de tarea y usuario no son válidos');
		error.statusCode = 400;
		throw error;
	}

	const task = await tasksRepository.findByIdAndUser(taskId, userId);

	if (!task) {
		const error = new Error('Tarea no encontrada');
		error.statusCode = 404;
		throw error;
	}

	return task;
}

async function updateTask(taskId, userId, data) {
	await getTaskById(taskId, userId);

	const dataFiltrada = {};
	const allowedFields = ['title', 'description', 'due_date', 'priority'];

	for (const field of allowedFields) {
		if (Object.prototype.hasOwnProperty.call(data, field)) {
			dataFiltrada[field] = data[field];
		}
	}

	return tasksRepository.update(taskId, userId, dataFiltrada);
}

async function changeStatus(taskId, userId, status) {
	await getTaskById(taskId, userId);

	await tasksRepository.updateStatus(taskId, userId, status);

	return getTaskById(taskId, userId);
}

async function deleteTask(taskId, userId) {
	await getTaskById(taskId, userId);

	await tasksRepository.softDelete(taskId, userId);
}

module.exports = {
	create,
	getTasks,
	getTaskById,
	updateTask,
	changeStatus,
	deleteTask,
};