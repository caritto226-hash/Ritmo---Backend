const { pool } = require('../../config/mysql');
const { maskToDays } = require('../../utils/habit-days');

// Meta de un día: 1 en los hábitos de solo marcar; goal en los de cantidad y tiempo.
const TARGET_SQL = "CASE WHEN h.goal_type = 'check' THEN 1 ELSE COALESCE(h.goal, 1) END";
// El hábito aplica en la fecha (?, ?): su día de la semana está en days_mask (WEEKDAY: 0 = lunes)
// y ya había empezado.
const APPLIES_ON_SQL = '(h.days_mask & (1 << WEEKDAY(?))) <> 0 AND h.start_date <= ?';

// Columnas del hábito con el avance de la fecha "today" (3 parámetros: today, today, today).
const HABIT_SELECT_SQL = `SELECT h.id, h.user_id AS userId, h.category_id AS categoryId,
			h.name, h.frequency, h.days_mask AS daysMask, h.start_date AS startDate,
			h.reminder_time AS reminderTime, h.goal_type AS goalType, h.goal, h.unit,
			COALESCE(hc.amount, 0) AS todayAmount,
			COALESCE(hc.target, ${TARGET_SQL}) AS todayTarget,
			CASE WHEN hc.amount >= hc.target THEN 'completado' ELSE 'pendiente' END AS status,
			${APPLIES_ON_SQL} AS appliesToday,
			h.creation_date AS creationDate,
			c.name AS categoryName, c.description AS categoryDescription,
			c.icon AS categoryIcon, c.color AS categoryColor
		FROM habits h
		LEFT JOIN categories c ON c.id = h.category_id AND c.user_id = h.user_id
		LEFT JOIN habit_completions hc
			ON hc.habit_id = h.id AND hc.user_id = h.user_id AND hc.completion_date = ?`;

function mapHabit(row) {
	const {
		categoryName,
		categoryDescription,
		categoryIcon,
		categoryColor,
		daysMask,
		appliesToday,
		...habit
	} = row;

	return {
		...habit,
		days: maskToDays(daysMask),
		appliesToday: Boolean(appliesToday),
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

function mapProgress(row) {
	return {
		...row,
		completed: row.amount >= row.target,
	};
}

async function create(habitData) {
	const {
		userId,
		name,
		frequency,
		daysMask,
		startDate,
		reminderTime,
		goalType,
		goal,
		unit,
		status,
		categoryId,
		today,
	} = habitData;

	const [result] = await pool.query(
		`INSERT INTO habits (user_id, category_id, name, frequency, days_mask, start_date, reminder_time,
			goal_type, goal, unit, status, creation_date)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
		[userId, categoryId, name, frequency, daysMask, startDate, reminderTime, goalType, goal, unit, status],
	);

	return findByIdAndUser(result.insertId, userId, today);
}

async function findAllByUser(userId, today) {
	const [rows] = await pool.query(
		`${HABIT_SELECT_SQL}
		WHERE h.user_id = ? AND h.deleted_at IS NULL
		ORDER BY h.creation_date ASC`,
		[today, today, today, userId],
	);

	return rows.map(mapHabit);
}

// Hábitos que aplican hoy y todavía no llegan a su meta (lista "upcoming" de /dashboard).
async function findPendingTodayByUser(userId, today) {
	const [rows] = await pool.query(
		`${HABIT_SELECT_SQL}
		WHERE h.user_id = ? AND h.deleted_at IS NULL
			AND ${APPLIES_ON_SQL}
			AND (hc.habit_id IS NULL OR hc.amount < hc.target)
		ORDER BY h.creation_date ASC`,
		[today, today, today, userId, today, today],
	);

	return rows.map(mapHabit);
}

// Solo cuentan los hábitos que aplican hoy; cumplido = el avance llegó a la meta.
async function findTodayStatsByUser(userId, today) {
	const [rows] = await pool.query(
		`SELECT COUNT(h.id) AS total, COUNT(CASE WHEN hc.amount >= hc.target THEN 1 END) AS completed
		FROM habits h
		LEFT JOIN habit_completions hc
			ON hc.habit_id = h.id AND hc.user_id = h.user_id AND hc.completion_date = ?
		WHERE h.user_id = ? AND h.deleted_at IS NULL AND ${APPLIES_ON_SQL}`,
		[today, userId, today, today],
	);

	return {
		completed: Number(rows[0].completed),
		total: Number(rows[0].total),
	};
}

async function findByIdAndUser(habitId, userId, today) {
	const [rows] = await pool.query(
		`${HABIT_SELECT_SQL}
		WHERE h.id = ? AND h.user_id = ? AND h.deleted_at IS NULL LIMIT 1`,
		[today, today, today, habitId, userId],
	);

	return rows[0] ? mapHabit(rows[0]) : null;
}

async function update(habitId, userId, fields, today) {
	const columnMap = {
		name: 'name',
		frequency: 'frequency',
		daysMask: 'days_mask',
		reminderTime: 'reminder_time',
		goalType: 'goal_type',
		goal: 'goal',
		unit: 'unit',
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

async function findProgress(habitId, userId, date) {
	const [rows] = await pool.query(
		`SELECT completion_date AS date, amount, target, completed_at AS completedAt
		FROM habit_completions
		WHERE habit_id = ? AND user_id = ? AND completion_date = ? LIMIT 1`,
		[habitId, userId, date],
	);

	return rows[0] ? mapProgress(rows[0]) : null;
}

async function findProgressByUserAndRange(userId, from, to) {
	const [rows] = await pool.query(
		`SELECT hc.habit_id AS habitId, hc.completion_date AS date, hc.amount, hc.target,
			hc.completed_at AS completedAt
		FROM habit_completions hc
		JOIN habits h ON h.id = hc.habit_id AND h.user_id = hc.user_id AND h.deleted_at IS NULL
		WHERE hc.user_id = ? AND hc.completion_date BETWEEN ? AND ?
		ORDER BY hc.completion_date ASC, hc.habit_id ASC`,
		[userId, from, to],
	);

	return rows.map(mapProgress);
}

// Días cumplidos (avance >= meta) de los hábitos activos hasta "today", para las rachas.
async function findCompletedDaysByUser(userId, today) {
	const [rows] = await pool.query(
		`SELECT hc.habit_id AS habitId, hc.completion_date AS date
		FROM habit_completions hc
		JOIN habits h ON h.id = hc.habit_id AND h.user_id = hc.user_id AND h.deleted_at IS NULL
		WHERE hc.user_id = ? AND hc.completion_date <= ? AND hc.amount >= hc.target`,
		[userId, today],
	);

	return rows;
}

// "Cumplido": el avance sube hasta la meta del día (si ya la superaba, se queda como está).
async function markCompleted(habitId, userId, date, target) {
	await pool.query(
		`INSERT INTO habit_completions (habit_id, user_id, completion_date, amount, target, completed_at)
		VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
		ON DUPLICATE KEY UPDATE amount = GREATEST(amount, target),
			completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)`,
		[habitId, userId, date, target, target],
	);
}

async function deleteProgress(habitId, userId, date) {
	await pool.query(
		'DELETE FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completion_date = ?',
		[habitId, userId, date],
	);
}

// Valor exacto del día. Una fila que ya existe conserva su meta (la de ese día).
async function setProgress(habitId, userId, date, amount, target) {
	if (amount === 0) {
		await deleteProgress(habitId, userId, date);
		return;
	}

	await pool.query(
		`INSERT INTO habit_completions (habit_id, user_id, completion_date, amount, target, completed_at)
		VALUES (?, ?, ?, ?, ?, IF(? >= ?, CURRENT_TIMESTAMP, NULL))
		ON DUPLICATE KEY UPDATE
			completed_at = IF(? >= target, COALESCE(completed_at, CURRENT_TIMESTAMP), NULL),
			amount = ?`,
		[habitId, userId, date, amount, target, amount, target, amount, amount],
	);
}

// Suma atómica (varios "+1" seguidos no se pisan), entre 0 y maxAmount. Si queda en 0 se borra.
async function incrementProgress(habitId, userId, date, delta, target, maxAmount) {
	await pool.query(
		`INSERT INTO habit_completions (habit_id, user_id, completion_date, amount, target, completed_at)
		VALUES (?, ?, ?, LEAST(?, GREATEST(0, ?)), ?, IF(LEAST(?, GREATEST(0, ?)) >= ?, CURRENT_TIMESTAMP, NULL))
		ON DUPLICATE KEY UPDATE
			completed_at = IF(LEAST(?, GREATEST(0, amount + ?)) >= target, COALESCE(completed_at, CURRENT_TIMESTAMP), NULL),
			amount = LEAST(?, GREATEST(0, amount + ?))`,
		[
			habitId, userId, date, maxAmount, delta, target, maxAmount, delta, target,
			maxAmount, delta,
			maxAmount, delta,
		],
	);

	await pool.query(
		'DELETE FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completion_date = ? AND amount = 0',
		[habitId, userId, date],
	);
}

// Al cambiar la meta, el registro de hoy toma la nueva (los días anteriores conservan la suya).
async function syncTarget(habitId, userId, date, target) {
	await pool.query(
		`UPDATE habit_completions
		SET target = ?,
			completed_at = CASE WHEN amount >= ? THEN COALESCE(completed_at, CURRENT_TIMESTAMP) ELSE NULL END
		WHERE habit_id = ? AND user_id = ? AND completion_date = ?`,
		[target, target, habitId, userId, date],
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
	findProgress,
	findProgressByUserAndRange,
	findCompletedDaysByUser,
	markCompleted,
	deleteProgress,
	setProgress,
	incrementProgress,
	syncTarget,
	softDelete,
};
