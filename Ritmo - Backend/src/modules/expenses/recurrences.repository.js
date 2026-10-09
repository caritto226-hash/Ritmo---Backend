const { pool } = require('../../config/mysql');

async function create(data) {
	const connection = await pool.getConnection();

	try {
		await connection.beginTransaction();
		const [result] = await connection.query(
			`INSERT INTO expense_recurrences (
				user_id, category_id, concept, amount, notes, frequency,
				start_date, next_scheduled_date, anchor_day, anchor_month
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				data.userId,
				data.categoryId,
				data.concept,
				data.amount,
				data.notes,
				data.frequency,
				data.startDate,
				data.startDate,
				data.anchorDay,
				data.anchorMonth,
			],
		);

		await connection.query(
			`INSERT INTO expense_recurrence_occurrences
				(recurrence_id, user_id, scheduled_date, status)
			VALUES (?, ?, ?, 'pending')`,
			[result.insertId, data.userId, data.startDate],
		);

		await connection.commit();
		return result.insertId;
	} catch (error) {
		await connection.rollback();
		throw error;
	} finally {
		connection.release();
	}
}

async function findRemindersByUser(userId) {
	const [rows] = await pool.query(
		`SELECT
			occurrence.id AS occurrenceId,
			DATE_FORMAT(occurrence.scheduled_date, '%Y-%m-%d') AS scheduledDate,
			occurrence.status,
			recurrence.id AS recurrenceId,
			recurrence.concept,
			recurrence.amount,
			recurrence.notes,
			recurrence.frequency,
			DATE_FORMAT(recurrence.start_date, '%Y-%m-%d') AS startDate,
			recurrence.is_active AS isActive,
			recurrence.canceled_at AS canceledAt,
			recurrence.category_id AS categoryId,
			category.name AS categoryName,
			category.icon AS categoryIcon,
			category.color AS categoryColor
		FROM expense_recurrence_occurrences AS occurrence
		JOIN expense_recurrences AS recurrence
			ON recurrence.id = occurrence.recurrence_id
			AND recurrence.user_id = occurrence.user_id
		JOIN categories AS category
			ON category.id = recurrence.category_id
			AND category.user_id = recurrence.user_id
		WHERE occurrence.user_id = ?
			AND occurrence.status = 'pending'
			AND recurrence.deleted_at IS NULL
		ORDER BY occurrence.scheduled_date ASC, occurrence.id ASC`,
		[userId],
	);

	return rows.map((row) => ({
		id: row.occurrenceId,
		occurrenceId: row.occurrenceId,
		recurrenceId: row.recurrenceId,
		concept: row.concept,
		amount: Number(row.amount),
		notes: row.notes,
		frequency: row.frequency,
		startDate: formatDate(row.startDate),
		scheduledDate: formatDate(row.scheduledDate),
		isActive: Boolean(row.isActive),
		isCanceled: row.canceledAt !== null,
		categoryId: row.categoryId,
		category: {
			id: row.categoryId,
			module: 'finance',
			name: row.categoryName,
			icon: row.categoryIcon,
			color: row.categoryColor,
		},
	}));
}

async function confirmOccurrence(occurrenceId, userId, paidDate) {
	const connection = await pool.getConnection();

	try {
		await connection.beginTransaction();
		const [rows] = await connection.query(
			`SELECT
				occurrence.id AS occurrenceId,
				DATE_FORMAT(occurrence.scheduled_date, '%Y-%m-%d') AS scheduledDate,
				occurrence.status,
				recurrence.id AS recurrenceId,
				recurrence.category_id AS categoryId,
				recurrence.concept,
				recurrence.amount,
				recurrence.notes,
				recurrence.frequency,
				recurrence.anchor_day AS anchorDay,
				recurrence.anchor_month AS anchorMonth,
				recurrence.is_active AS isActive,
				recurrence.canceled_at AS canceledAt
			FROM expense_recurrence_occurrences AS occurrence
			JOIN expense_recurrences AS recurrence
				ON recurrence.id = occurrence.recurrence_id
				AND recurrence.user_id = occurrence.user_id
			WHERE occurrence.id = ?
				AND occurrence.user_id = ?
				AND recurrence.deleted_at IS NULL
			FOR UPDATE`,
			[occurrenceId, userId],
		);
		const occurrence = rows[0];

		if (!occurrence) {
			const error = new Error('Recordatorio financiero no encontrado');
			error.statusCode = 404;
			throw error;
		}
		if (occurrence.status !== 'pending') {
			const error = new Error('Este recordatorio ya fue atendido');
			error.statusCode = 409;
			throw error;
		}

		const [expenseResult] = await connection.query(
			`INSERT INTO expenses (
				user_id, category_id, recurrence_id, concept, amount,
				expense_date, scheduled_date, notes, created_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
			[
				userId,
				occurrence.categoryId,
				occurrence.recurrenceId,
				occurrence.concept,
				occurrence.amount,
				paidDate,
				formatDate(occurrence.scheduledDate),
				occurrence.notes ?? '',
			],
		);

		await connection.query(
			`UPDATE expense_recurrence_occurrences
			SET status = 'confirmed', expense_id = ?, confirmed_at = NOW()
			WHERE id = ? AND user_id = ? AND status = 'pending'`,
			[expenseResult.insertId, occurrenceId, userId],
		);

		let nextScheduledDate = null;
		if (Boolean(occurrence.isActive) && occurrence.canceledAt === null) {
			nextScheduledDate = getNextScheduledDate(
				formatDate(occurrence.scheduledDate),
				occurrence.frequency,
				Number(occurrence.anchorDay),
				Number(occurrence.anchorMonth),
			);
			await connection.query(
				`UPDATE expense_recurrences
				SET next_scheduled_date = ?
				WHERE id = ? AND user_id = ? AND is_active = 1 AND canceled_at IS NULL`,
				[nextScheduledDate, occurrence.recurrenceId, userId],
			);
			await connection.query(
				`INSERT INTO expense_recurrence_occurrences
					(recurrence_id, user_id, scheduled_date, status)
				VALUES (?, ?, ?, 'pending')`,
				[occurrence.recurrenceId, userId, nextScheduledDate],
			);
		}

		await connection.commit();
		return {
			expenseId: expenseResult.insertId,
			occurrenceId,
			recurrenceId: occurrence.recurrenceId,
			paidDate,
			scheduledDate: formatDate(occurrence.scheduledDate),
			nextScheduledDate,
		};
	} catch (error) {
		await connection.rollback();
		throw error;
	} finally {
		connection.release();
	}
}

async function cancel(recurrenceId, userId, scope, today) {
	const connection = await pool.getConnection();

	try {
		await connection.beginTransaction();
		const [rows] = await connection.query(
			`SELECT id, is_active, deleted_at
			FROM expense_recurrences
			WHERE id = ? AND user_id = ?
			FOR UPDATE`,
			[recurrenceId, userId],
		);
		if (!rows[0] || rows[0].deleted_at !== null) {
			const error = new Error('Recurrencia financiera no encontrada');
			error.statusCode = 404;
			throw error;
		}

		if (scope === 'all') {
			await connection.query(
				`UPDATE expense_recurrence_occurrences
				SET status = 'canceled'
				WHERE recurrence_id = ? AND user_id = ? AND status = 'pending'`,
				[recurrenceId, userId],
			);
			await connection.query(
				`UPDATE expense_recurrences
				SET is_active = 0, deleted_at = NOW()
				WHERE id = ? AND user_id = ?`,
				[recurrenceId, userId],
			);
		} else {
			await connection.query(
				`UPDATE expense_recurrence_occurrences
				SET status = 'canceled'
				WHERE recurrence_id = ? AND user_id = ?
					AND status = 'pending' AND scheduled_date > ?`,
				[recurrenceId, userId, today],
			);
			await connection.query(
				`UPDATE expense_recurrences
				SET is_active = 0, canceled_at = NOW()
				WHERE id = ? AND user_id = ?`,
				[recurrenceId, userId],
			);
		}

		await connection.commit();
		return { recurrenceId, scope };
	} catch (error) {
		await connection.rollback();
		throw error;
	} finally {
		connection.release();
	}
}

function getNextScheduledDate(dateValue, frequency, anchorDay, anchorMonth) {
	const [year, month, day] = dateValue.split('-').map(Number);
	const current = new Date(Date.UTC(year, month - 1, day));

	if (frequency === 'daily') {
		current.setUTCDate(current.getUTCDate() + 1);
	} else if (frequency === 'weekly') {
		current.setUTCDate(current.getUTCDate() + 7);
	} else if (frequency === 'monthly') {
		const nextMonth = current.getUTCMonth() + 1;
		const nextYear = current.getUTCFullYear() + Math.floor(nextMonth / 12);
		const normalizedMonth = nextMonth % 12;
		const lastDay = new Date(Date.UTC(nextYear, normalizedMonth + 1, 0)).getUTCDate();
		current.setUTCFullYear(nextYear, normalizedMonth, Math.min(anchorDay, lastDay));
	} else {
		const nextYear = current.getUTCFullYear() + 1;
		const lastDay = new Date(Date.UTC(nextYear, anchorMonth, 0)).getUTCDate();
		current.setUTCFullYear(nextYear, anchorMonth - 1, Math.min(anchorDay, lastDay));
	}

	return formatDate(current);
}

function formatDate(value) {
	if (value instanceof Date) {
		return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;
	}
	return String(value).slice(0, 10);
}

module.exports = {
	create,
	findRemindersByUser,
	confirmOccurrence,
	cancel,
	getNextScheduledDate,
};
