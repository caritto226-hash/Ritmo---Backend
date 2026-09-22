const { pool } = require('../../config/mysql');

async function create(expenseData) {
	const {
		userId,
		concept,
		category,
		amount,
		expenseDate,
		notes,
	} = expenseData;

	const [result] = await pool.query(
		'INSERT INTO expenses (user_id, concept, category, amount, expense_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
		[userId, concept, category, amount, expenseDate, notes],
	);

	const [rows] = await pool.query(
		'SELECT id, user_id AS userId, concept, category, amount, expense_date AS expenseDate, notes, created_at AS createdAt FROM expenses WHERE id = ?',
		[result.insertId],
	);

	return rows[0] || null;
}

async function findAllByUser(userId) {
	const [rows] = await pool.query(
		'SELECT id, user_id AS userId, concept, category, amount, expense_date AS expenseDate, notes, created_at AS createdAt FROM expenses WHERE user_id = ? AND deleted_at IS NULL ORDER BY expense_date DESC, created_at DESC',
		[userId],
	);

	return rows;
}

async function findRecentByUser(userId) {
	const [rows] = await pool.query(
		"SELECT id, user_id AS userId, concept, category, amount, expense_date AS expenseDate, notes, created_at AS createdAt FROM expenses WHERE user_id = ? AND expense_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND expense_date < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH) AND deleted_at IS NULL ORDER BY expense_date ASC, created_at ASC",
		[userId],
	);

	return rows;
}

async function findByIdAndUser(expenseId, userId) {
	const [rows] = await pool.query(
		'SELECT id, user_id AS userId, concept, category, amount, expense_date AS expenseDate, notes, created_at AS createdAt FROM expenses WHERE id = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1',
		[expenseId, userId],
	);

	return rows[0] || null;
}

async function update(expenseId, userId, fields) {
	const columnMap = {
		concept: 'concept',
		category: 'category',
		amount: 'amount',
		expense_date: 'expense_date',
		notes: 'notes',
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
		values.push(expenseId, userId);

		await pool.query(
			`UPDATE expenses SET ${assignments.join(', ')} WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
			values,
		);
	}

	return findByIdAndUser(expenseId, userId);
}

async function softDelete(expenseId, userId) {
	await pool.query(
		'UPDATE expenses SET deleted_at = NOW() WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
		[expenseId, userId],
	);
}

module.exports = {
	create,
	findAllByUser,
	findRecentByUser,
	findByIdAndUser,
	update,
	softDelete,
};
