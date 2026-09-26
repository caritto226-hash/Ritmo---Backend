const { pool } = require('../../config/mysql');

const statusToDatabase = {
	pendiente: 'Pendiente',
	en_proceso: 'En proceso',
	completada: 'Completada',
};

const statusToApplication = {
	Pendiente: 'pendiente',
	'En proceso': 'en_proceso',
	Completada: 'completada',
};

const priorityToDatabase = {
	alta: 'Alta',
	media: 'Media',
	baja: 'Baja',
};

const priorityToApplication = {
	Alta: 'alta',
	Media: 'media',
	Baja: 'baja',
};

function mapTaskFromDatabase(task) {
	if (!task) {
		return task;
	}

	return {
		...task,
		priority: priorityToApplication[task.priority] ?? task.priority,
		status: statusToApplication[task.status] ?? task.status,
	};
}

function mapTasksFromDatabase(tasks) {
	return tasks.map(mapTaskFromDatabase);
}

async function create(taskData) {
	const {
		userId,
		title,
		description,
		dueDate,
		duration,
		startAt,
		endAt,
		priority,
		status,
	} = taskData;

	const [result] = await pool.query(
		'INSERT INTO tasks (user_id, title, description, due_date, duration, start_at, end_at, priority, status, creation_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
		[userId, title, description, dueDate, duration, startAt, endAt, priorityToDatabase[priority] ?? priority, statusToDatabase[status] ?? status],
	);

	const [rows] = await pool.query(
		'SELECT id, user_id AS userId, title, description, due_date AS dueDate, duration, start_at AS startAt, end_at AS endAt, priority, status, creation_date AS creationDate FROM tasks WHERE id = ?',
		[result.insertId],
	);

	return mapTaskFromDatabase(rows[0] || null);
}

async function findAllByUser(userId) {
	const [rows] = await pool.query(
		'SELECT id, user_id AS userId, title, description, due_date AS dueDate, duration, start_at AS startAt, end_at AS endAt, priority, status, creation_date AS creationDate FROM tasks WHERE user_id = ? AND deleted_at IS NULL ORDER BY COALESCE(start_at, creation_date) ASC',
		[userId],
	);

	return mapTasksFromDatabase(rows);
}

async function findTodayStatsByUser(userId) {
	const [rows] = await pool.query(
		"SELECT COUNT(*) AS total, COALESCE(SUM(LOWER(status) = 'completada'), 0) AS completed FROM tasks WHERE user_id = ? AND due_date = CURDATE() AND deleted_at IS NULL",
		[userId],
	);

	return {
		completed: Number(rows[0].completed),
		total: Number(rows[0].total),
	};
}

async function findUpcomingByUser(userId) {
	const [rows] = await pool.query(
		"SELECT id, user_id AS userId, title, description, due_date AS dueDate, duration, start_at AS startAt, end_at AS endAt, priority, status, creation_date AS creationDate FROM tasks WHERE user_id = ? AND due_date >= CURDATE() AND LOWER(status) != 'completada' AND deleted_at IS NULL ORDER BY due_date ASC",
		[userId],
	);

	return mapTasksFromDatabase(rows);
}

async function findByIdAndUser(taskId, userId) {
	const [rows] = await pool.query(
		'SELECT id, user_id AS userId, title, description, due_date AS dueDate, duration, start_at AS startAt, end_at AS endAt, priority, status, creation_date AS creationDate FROM tasks WHERE id = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1',
		[taskId, userId],
	);

	return mapTaskFromDatabase(rows[0] || null);
}

async function update(taskId, userId, fields) {
	const columnMap = {
		title: 'title',
		description: 'description',
		due_date: 'due_date',
		priority: 'priority',
	};
	const assignments = [];
	const values = [];

	for (const [field, value] of Object.entries(fields)) {
		const column = columnMap[field];

		if (column) {
			assignments.push(`${column} = ?`);
			values.push(field === 'priority' ? priorityToDatabase[value] ?? value : value);
		}
	}

	if (assignments.length > 0) {
		values.push(taskId, userId);

		await pool.query(
			`UPDATE tasks SET ${assignments.join(', ')} WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
			values,
		);
	}

	return findByIdAndUser(taskId, userId);
}

async function updateStatus(taskId, userId, status) {
	await pool.query(
		'UPDATE tasks SET status = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
		[statusToDatabase[status] ?? status, taskId, userId],
	);
}

async function softDelete(taskId, userId) {
	await pool.query(
		'UPDATE tasks SET deleted_at = NOW() WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
		[taskId, userId],
	);
}

module.exports = {
	create,
	findAllByUser,
	findTodayStatsByUser,
	findUpcomingByUser,
	findByIdAndUser,
	update,
	updateStatus,
	softDelete,
};