const { pool } = require('../../config/mysql');

function mapHabit(row) {
	const {
		categoryName,
		categoryDescription,
		categoryIcon,
		categoryColor,
		...habit
	} = row;

	return {
		...habit,
		category: habit.categoryId === null ? null : {
			id: habit.categoryId,
			module: 'habits',
			name: categoryName,
			description: categoryDescription,
			icon: categoryIcon,
			color: categoryColor,
		},
	};
}

async function create(habitData) {
	const {
		userId,
		name,
		frequency,
		reminderTime,
		goal,
		status,
		categoryId,
		today,
	} = habitData;

	const [result] = await pool.query(
		'INSERT INTO habits (user_id, category_id, name, frequency, reminder_time, goal, status, creation_date) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
		[userId, categoryId, name, frequency, reminderTime, goal, status],
	);

	return findByIdAndUser(result.insertId, userId, today);
}

async function findAllByUser(userId, today) {
	const [rows] = await pool.query(
		`SELECT h.id, h.user_id AS userId, h.category_id AS categoryId,
			h.name, h.frequency, h.reminder_time AS reminderTime, h.goal,
			CASE WHEN hc.habit_id IS NULL THEN 'pendiente' ELSE 'completado' END AS status,
			h.creation_date AS creationDate,
			c.name AS categoryName, c.description AS categoryDescription,
			c.icon AS categoryIcon, c.color AS categoryColor
		FROM habits h
		LEFT JOIN categories c ON c.id = h.category_id AND c.user_id = h.user_id
		LEFT JOIN habit_completions hc
			ON hc.habit_id = h.id AND hc.user_id = h.user_id AND hc.completion_date = ?
		WHERE h.user_id = ? AND h.deleted_at IS NULL
		ORDER BY h.creation_date ASC`,
		[today, userId],
	);

	return rows.map(mapHabit);
}

async function findPendingTodayByUser(userId, today) {
	const [rows] = await pool.query(
		`SELECT h.id, h.user_id AS userId, h.category_id AS categoryId,
			h.name, h.frequency, h.reminder_time AS reminderTime, h.goal,
			'pendiente' AS status, h.creation_date AS creationDate,
			c.name AS categoryName, c.description AS categoryDescription,
			c.icon AS categoryIcon, c.color AS categoryColor
		FROM habits h
		LEFT JOIN categories c ON c.id = h.category_id AND c.user_id = h.user_id
		LEFT JOIN habit_completions hc
			ON hc.habit_id = h.id AND hc.user_id = h.user_id AND hc.completion_date = ?
		WHERE h.user_id = ? AND h.deleted_at IS NULL AND hc.habit_id IS NULL
		ORDER BY h.creation_date ASC`,
		[today, userId],
	);

	return rows.map(mapHabit);
}

async function findTodayStatsByUser(userId, today) {
	const [rows] = await pool.query(
		`SELECT COUNT(h.id) AS total, COUNT(hc.habit_id) AS completed
		FROM habits h
		LEFT JOIN habit_completions hc
			ON hc.habit_id = h.id AND hc.user_id = h.user_id AND hc.completion_date = ?
		WHERE h.user_id = ? AND h.deleted_at IS NULL`,
		[today, userId],
	);

	return {
		completed: Number(rows[0].completed),
		total: Number(rows[0].total),
	};
}

async function findByIdAndUser(habitId, userId, today) {
	const [rows] = await pool.query(
		`SELECT h.id, h.user_id AS userId, h.category_id AS categoryId,
			h.name, h.frequency, h.reminder_time AS reminderTime, h.goal,
			CASE WHEN hc.habit_id IS NULL THEN 'pendiente' ELSE 'completado' END AS status,
			h.creation_date AS creationDate,
			c.name AS categoryName, c.description AS categoryDescription,
			c.icon AS categoryIcon, c.color AS categoryColor
		FROM habits h
		LEFT JOIN categories c ON c.id = h.category_id AND c.user_id = h.user_id
		LEFT JOIN habit_completions hc
			ON hc.habit_id = h.id AND hc.user_id = h.user_id AND hc.completion_date = ?
		WHERE h.id = ? AND h.user_id = ? AND h.deleted_at IS NULL LIMIT 1`,
		[today, habitId, userId],
	);

	return rows[0] ? mapHabit(rows[0]) : null;
}

async function update(habitId, userId, fields, today) {
	const columnMap = {
		name: 'name',
		frequency: 'frequency',
		reminderTime: 'reminder_time',
		goal: 'goal',
		categoryId: 'category_id',
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

	return findByIdAndUser(habitId, userId, today);
}

async function updateStatus(habitId, userId, status, today) {
	if (status === 'completado') {
		await pool.query(
			`INSERT INTO habit_completions (habit_id, user_id, completion_date)
			SELECT id, user_id, ? FROM habits
			WHERE id = ? AND user_id = ? AND deleted_at IS NULL
			ON DUPLICATE KEY UPDATE completed_at = CURRENT_TIMESTAMP`,
			[today, habitId, userId],
		);
		return;
	}

	await pool.query(
		'DELETE FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completion_date = ?',
		[habitId, userId, today],
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
	findTodayStatsByUser,
	findByIdAndUser,
	update,
	updateStatus,
	softDelete,
};