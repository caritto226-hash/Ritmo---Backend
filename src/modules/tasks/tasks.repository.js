const { pool } = require('../../config/mysql');

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
		[userId, title, description, dueDate, duration, startAt, endAt, priority, status],
	);

	const [rows] = await pool.query(
		'SELECT id, user_id AS userId, title, description, due_date AS dueDate, duration, start_at AS startAt, end_at AS endAt, priority, status, creation_date AS creationDate FROM tasks WHERE id = ?',
		[result.insertId],
	);

	return rows[0] || null;
}

async function findAllByUser(userId) {
	const [rows] = await pool.query(
		'SELECT id, user_id AS userId, title, description, due_date AS dueDate, duration, start_at AS startAt, end_at AS endAt, priority, status, creation_date AS creationDate FROM tasks WHERE user_id = ? AND deleted_at IS NULL ORDER BY COALESCE(start_at, creation_date) ASC',
		[userId],
	);

	return rows;
}

async function findByIdAndUser(taskId, userId) {
	const [rows] = await pool.query(
		'SELECT id, user_id AS userId, title, description, due_date AS dueDate, duration, start_at AS startAt, end_at AS endAt, priority, status, creation_date AS creationDate FROM tasks WHERE id = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1',
		[taskId, userId],
	);

	return rows[0] || null;
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
			values.push(value);
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

module.exports = {
	create,
	findAllByUser,
	findByIdAndUser,
	update,
};