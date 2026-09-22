const { pool } = require('../../config/mysql');

async function create(habitData) {
	const {
		userId,
		name,
		frequency,
		goal,
		status,
	} = habitData;

	const [result] = await pool.query(
		'INSERT INTO habits (user_id, name, frequency, goal, status, creation_date) VALUES (?, ?, ?, ?, ?, NOW())',
		[userId, name, frequency, goal, status],
	);

	const [rows] = await pool.query(
		'SELECT id, user_id AS userId, name, frequency, goal, status, creation_date AS creationDate FROM habits WHERE id = ?',
		[result.insertId],
	);

	return rows[0] || null;
}

async function findAllByUser(userId) {
	const [rows] = await pool.query(
		'SELECT id, user_id AS userId, name, frequency, goal, status, creation_date AS creationDate FROM habits WHERE user_id = ? AND deleted_at IS NULL ORDER BY creation_date ASC',
		[userId],
	);

	return rows;
}

async function findPendingTodayByUser(userId) {
	const [rows] = await pool.query(
		"SELECT id, user_id AS userId, name, frequency, goal, status, creation_date AS creationDate FROM habits WHERE user_id = ? AND status = 'pendiente' AND deleted_at IS NULL ORDER BY creation_date ASC",
		[userId],
	);

	return rows;
}

async function findByIdAndUser(habitId, userId) {
	const [rows] = await pool.query(
		'SELECT id, user_id AS userId, name, frequency, goal, status, creation_date AS creationDate FROM habits WHERE id = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1',
		[habitId, userId],
	);

	return rows[0] || null;
}

async function update(habitId, userId, fields) {
	const columnMap = {
		name: 'name',
		frequency: 'frequency',
		goal: 'goal',
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
		values.push(habitId, userId);

		await pool.query(
			`UPDATE habits SET ${assignments.join(', ')} WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
			values,
		);
	}

	return findByIdAndUser(habitId, userId);
}

async function updateStatus(habitId, userId, status) {
	await pool.query(
		'UPDATE habits SET status = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
		[status, habitId, userId],
	);
}

async function softDelete(habitId, userId) {
	await pool.query(
		'UPDATE habits SET deleted_at = NOW() WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
		[habitId, userId],
	);
}

module.exports = {
	create,
	findAllByUser,
	findPendingTodayByUser,
	findByIdAndUser,
	update,
	updateStatus,
	softDelete,
};