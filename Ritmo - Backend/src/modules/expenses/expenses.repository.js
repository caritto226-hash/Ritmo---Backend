const { pool } = require('../../config/mysql');

const expenseSelect = `SELECT
	expense.id,
	expense.user_id AS userId,
	expense.category_id AS categoryId,
	expense.recurrence_id AS recurrenceId,
	expense.concept,
	expense.amount,
	expense.expense_date AS expenseDate,
	expense.scheduled_date AS scheduledDate,
	expense.notes,
	expense.created_at AS createdAt,
	category.module AS categoryModule,
	category.name AS categoryName,
	category.icon AS categoryIcon,
	category.color AS categoryColor,
	category.is_default AS categoryIsDefault,
	category.is_active AS categoryIsActive
FROM expenses AS expense
JOIN categories AS category
	ON category.id = expense.category_id AND category.user_id = expense.user_id`;

function mapExpense(row) {
	const {
		categoryModule,
		categoryName,
		categoryIcon,
		categoryColor,
		categoryIsDefault,
		categoryIsActive,
		...expense
	} = row;

	return {
		...expense,
		category: {
			id: expense.categoryId,
			module: categoryModule,
			name: categoryName,
			icon: categoryIcon,
			color: categoryColor,
			isDefault: Boolean(categoryIsDefault),
			isActive: Boolean(categoryIsActive),
		},
	};
}

async function create(expenseData) {
	const {
		userId,
		concept,
		categoryId,
		amount,
		expenseDate,
		notes,
	} = expenseData;

	const [result] = await pool.query(
		'INSERT INTO expenses (user_id, category_id, concept, amount, expense_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
		[userId, categoryId, concept, amount, expenseDate, notes],
	);

	return findByIdAndUser(result.insertId, userId);
}

async function findAllByUser(userId, categoryId) {
	const filterByCategory = categoryId === undefined ? '' : ' AND expense.category_id = ?';
	const values = categoryId === undefined ? [userId] : [userId, categoryId];
	const [rows] = await pool.query(
		`${expenseSelect}
		WHERE expense.user_id = ? AND expense.deleted_at IS NULL${filterByCategory}
		ORDER BY expense.expense_date DESC, expense.created_at DESC`,
		values,
	);

	return rows.map(mapExpense);
}

async function getMonthlySummaryByUser(userId) {
	const [rows] = await pool.query(
		`SELECT
			COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) AS income,
			COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) AS expenses,
			COALESCE(SUM(amount), 0) AS balance
		FROM expenses
		WHERE user_id = ?
			AND deleted_at IS NULL
			AND expense_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
			AND expense_date < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)`,
		[userId],
	);

	return rows[0];
}

async function findRecentByUser(userId) {
	const [rows] = await pool.query(
		`${expenseSelect}
		WHERE expense.user_id = ?
			AND expense.expense_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
			AND expense.expense_date < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
			AND expense.deleted_at IS NULL
		ORDER BY expense.expense_date ASC, expense.created_at ASC`,
		[userId],
	);

	return rows.map(mapExpense);
}

async function findByIdAndUser(expenseId, userId) {
	const [rows] = await pool.query(
		`${expenseSelect}
		WHERE expense.id = ? AND expense.user_id = ? AND expense.deleted_at IS NULL
		LIMIT 1`,
		[expenseId, userId],
	);

	return rows[0] ? mapExpense(rows[0]) : null;
}

async function update(expenseId, userId, fields) {
	const columnMap = {
		concept: 'concept',
		categoryId: 'category_id',
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
	getMonthlySummaryByUser,
	findRecentByUser,
	findByIdAndUser,
	update,
	softDelete,
};
