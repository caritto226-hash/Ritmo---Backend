const { pool } = require('../../config/mysql');
const { getNextDate } = require('../../utils/recurrence');

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

const taskSelect = `SELECT
	task.id,
	task.user_id AS userId,
	task.category_id AS categoryId,
	task.recurrence_frequency AS recurrenceFrequency,
	task.recurrence_anchor_day AS recurrenceAnchorDay,
	task.recurrence_anchor_month AS recurrenceAnchorMonth,
	task.title,
	task.description,
	task.due_date AS dueDate,
	task.duration,
	task.start_at AS startAt,
	task.end_at AS endAt,
	task.priority,
	task.status,
	task.creation_date AS creationDate,
	category.name AS categoryName,
	category.description AS categoryDescription,
	category.icon AS categoryIcon,
	category.color AS categoryColor
FROM tasks AS task
LEFT JOIN categories AS category
	ON category.id = task.category_id AND category.user_id = task.user_id`;

function mapTaskFromDatabase(task) {
	if (!task) {
		return task;
	}

	const {
		categoryName,
		categoryDescription,
		categoryIcon,
		categoryColor,
		...taskData
	} = task;

	return {
		...taskData,
		priority: priorityToApplication[taskData.priority] ?? taskData.priority,
		status: statusToApplication[taskData.status] ?? taskData.status,
		category: taskData.categoryId === null ? null : {
			id: taskData.categoryId,
			module: 'tasks',
			name: categoryName,
			description: categoryDescription,
			icon: categoryIcon,
			color: categoryColor,
		},
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
		categoryId,
		recurrenceFrequency,
		recurrenceAnchorDay,
		recurrenceAnchorMonth,
	} = taskData;

	const [result] = await pool.query(
		`INSERT INTO tasks (
			user_id, category_id, recurrence_frequency, recurrence_anchor_day,
			recurrence_anchor_month, title, description, due_date, duration,
			start_at, end_at, priority, status, creation_date
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
		[
			userId,
			categoryId,
			recurrenceFrequency,
			recurrenceAnchorDay,
			recurrenceAnchorMonth,
			title,
			description,
			dueDate,
			duration,
			startAt,
			endAt,
			priorityToDatabase[priority] ?? priority,
			statusToDatabase[status] ?? status,
		],
	);

	const [rows] = await pool.query(
		`${taskSelect} WHERE task.id = ?`,
		[result.insertId],
	);

	return mapTaskFromDatabase(rows[0] || null);
}

async function findAllByUser(userId) {
	const [rows] = await pool.query(
		`${taskSelect}
		WHERE task.user_id = ? AND task.deleted_at IS NULL
		ORDER BY COALESCE(task.start_at, task.creation_date) ASC`,
		[userId],
	);

	return mapTasksFromDatabase(rows);
}

async function findTodayStatsByUser(userId, today) {
	const [rows] = await pool.query(
		"SELECT COUNT(*) AS total, COALESCE(SUM(LOWER(TRIM(status)) = 'completada'), 0) AS completed FROM tasks WHERE user_id = ? AND due_date >= ? AND due_date < DATE_ADD(?, INTERVAL 1 DAY) AND deleted_at IS NULL",
		[userId, today, today],
	);

	return {
		completed: Number(rows[0].completed),
		total: Number(rows[0].total),
	};
}

async function findUpcomingByUser(userId, today) {
	const [rows] = await pool.query(
		`${taskSelect}
		WHERE task.user_id = ? AND task.due_date >= ?
			AND LOWER(TRIM(task.status)) != 'completada' AND task.deleted_at IS NULL
		ORDER BY task.due_date ASC`,
		[userId, today],
	);

	return mapTasksFromDatabase(rows);
}

async function findByIdAndUser(taskId, userId) {
	const [rows] = await pool.query(
		`${taskSelect}
		WHERE task.id = ? AND task.user_id = ? AND task.deleted_at IS NULL LIMIT 1`,
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
		categoryId: 'category_id',
		recurrenceFrequency: 'recurrence_frequency',
		recurrenceAnchorDay: 'recurrence_anchor_day',
		recurrenceAnchorMonth: 'recurrence_anchor_month',
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
	const connection = await pool.getConnection();

	try {
		await connection.beginTransaction();
		const [rows] = await connection.query(
			`SELECT id, category_id AS categoryId, recurrence_frequency AS recurrenceFrequency,
				recurrence_anchor_day AS recurrenceAnchorDay,
				recurrence_anchor_month AS recurrenceAnchorMonth,
				recurrence_advanced AS recurrenceAdvanced, title, description,
				DATE_FORMAT(due_date, '%Y-%m-%d') AS dueDate, duration, priority, status
			FROM tasks
			WHERE id = ? AND user_id = ? AND deleted_at IS NULL
			FOR UPDATE`,
			[taskId, userId],
		);
		const task = rows[0];
		if (!task) {
			const error = new Error('Tarea no encontrada');
			error.statusCode = 404;
			throw error;
		}

		const wasCompleted = statusToApplication[task.status] === 'completada';
		await connection.query(
			'UPDATE tasks SET status = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
			[statusToDatabase[status] ?? status, taskId, userId],
		);

		if (status === 'completada' && !wasCompleted
			&& !Boolean(task.recurrenceAdvanced) && task.recurrenceFrequency) {
			const nextDate = getNextDate(
				task.dueDate,
				task.recurrenceFrequency,
				Number(task.recurrenceAnchorDay),
				Number(task.recurrenceAnchorMonth),
			);
			await connection.query(
				`INSERT INTO tasks (
					user_id, category_id, recurrence_frequency, recurrence_anchor_day,
					recurrence_anchor_month, title, description, due_date, duration,
					priority, status, creation_date
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', NOW())`,
				[
					userId,
					task.categoryId,
					task.recurrenceFrequency,
					task.recurrenceAnchorDay,
					task.recurrenceAnchorMonth,
					task.title,
					task.description,
					nextDate,
					task.duration,
					task.priority,
				],
			);
			await connection.query(
				'UPDATE tasks SET recurrence_advanced = 1 WHERE id = ? AND user_id = ?',
				[taskId, userId],
			);
		}
		await connection.commit();
	} catch (error) {
		await connection.rollback();
		throw error;
	} finally {
		connection.release();
	}
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