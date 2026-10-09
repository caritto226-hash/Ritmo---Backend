const tasksRepository = require('./tasks.repository');
const categoriesRepository = require('../categories/categories.repository');

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
		categoryId,
		recurrenceFrequency,
	} = taskData;

	if ((categoryId !== undefined && categoryId !== null) || recurrenceFrequency) {
		await validateTaskCategory(categoryId, userId, Boolean(recurrenceFrequency));
	}

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
		categoryId: categoryId ?? null,
		recurrenceFrequency: recurrenceFrequency ?? null,
		recurrenceAnchorDay: recurrenceFrequency ? Number(date.split('-')[2]) : null,
		recurrenceAnchorMonth: recurrenceFrequency ? Number(date.split('-')[1]) : null,
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
	const task = await getTaskById(taskId, userId);

	const dataFiltrada = {};
	const allowedFields = ['title', 'description', 'due_date', 'priority', 'categoryId', 'recurrenceFrequency'];

	for (const field of allowedFields) {
		if (Object.prototype.hasOwnProperty.call(data, field)) {
			dataFiltrada[field] = data[field];
		}
	}

	if (Object.prototype.hasOwnProperty.call(dataFiltrada, 'categoryId')
		&& dataFiltrada.categoryId !== null
		&& dataFiltrada.categoryId !== task.categoryId) {
		await validateTaskCategory(dataFiltrada.categoryId, userId);
	}
	if (dataFiltrada.recurrenceFrequency
		&& (dataFiltrada.recurrenceFrequency !== task.recurrenceFrequency
			|| (dataFiltrada.categoryId !== undefined && dataFiltrada.categoryId !== task.categoryId))) {
		await validateTaskCategory(dataFiltrada.categoryId ?? task.categoryId, userId, true);
	}
	if (dataFiltrada.recurrenceFrequency) {
		const recurrenceStartDate = dataFiltrada.due_date ?? String(task.dueDate).slice(0, 10);
		dataFiltrada.recurrenceAnchorDay = Number(recurrenceStartDate.slice(8, 10));
		dataFiltrada.recurrenceAnchorMonth = Number(recurrenceStartDate.slice(5, 7));
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

async function validateTaskCategory(categoryId, userId, requireRecurrence = false) {
	if (!Number.isInteger(categoryId) || categoryId <= 0) {
		const error = new Error('Selecciona una categoría habilitada para recurrencias');
		error.statusCode = 400;
		throw error;
	}
	const category = await categoriesRepository.findByIdAndUser(categoryId, userId);
	if (!category || category.module !== 'tasks') {
		const error = new Error('Categoría de tarea no encontrada');
		error.statusCode = 404;
		throw error;
	}
	if (requireRecurrence && !category.isRecurring) {
		const error = new Error('La categoría seleccionada no permite recurrencias');
		error.statusCode = 400;
		throw error;
	}
	return category;
}

module.exports = {
	create,
	getTasks,
	getTaskById,
	updateTask,
	changeStatus,
	deleteTask,
};