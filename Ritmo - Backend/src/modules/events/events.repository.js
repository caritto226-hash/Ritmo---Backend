const { pool } = require('../../config/mysql');
const { getNextDate } = require('../../utils/recurrence');

async function create(eventData) {
	const {
		userId,
		title,
		description,
		eventDate,
		location,
		status,
		eventTime,
		duration,
		categoryId,
		recurrenceFrequency,
	} = eventData;

	const [result] = await pool.query(
		`INSERT INTO events (
			user_id, category_id, recurrence_frequency, recurrence_anchor_day,
			recurrence_anchor_month, title, description, event_date, location,
			status, event_time, duration
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			userId,
			categoryId,
			recurrenceFrequency,
			recurrenceFrequency ? Number(eventDate.slice(8, 10)) : null,
			recurrenceFrequency ? Number(eventDate.slice(5, 7)) : null,
			title,
			description,
			eventDate,
			location,
			status,
			eventTime,
			duration,
		],
	);

	return findByIdAndUser(result.insertId, userId);
}

async function findAllByUser(userId) {
	const [rows] = await pool.query(
		`SELECT event.id, event.user_id AS userId, event.category_id AS categoryId,
			event.recurrence_frequency AS recurrenceFrequency, event.title, event.description,
			event.event_date AS eventDate, event.location, event.status,
			event.event_time AS eventTime, event.duration,
			category.name AS categoryName, category.description AS categoryDescription,
			category.icon AS categoryIcon, category.color AS categoryColor
		FROM events AS event
		LEFT JOIN categories AS category
			ON category.id = event.category_id AND category.user_id = event.user_id
		WHERE event.user_id = ? AND event.deleted_at IS NULL
		ORDER BY event.event_date ASC, event.event_time ASC`,
		[userId],
	);

	return rows.map(mapEvent);
}

async function findUpcomingByUser(userId) {
	const [rows] = await pool.query(
		`SELECT event.id, event.user_id AS userId, event.category_id AS categoryId,
			event.recurrence_frequency AS recurrenceFrequency, event.title, event.description,
			event.event_date AS eventDate, event.location, event.status,
			event.event_time AS eventTime, event.duration,
			category.name AS categoryName, category.description AS categoryDescription,
			category.icon AS categoryIcon, category.color AS categoryColor
		FROM events AS event
		LEFT JOIN categories AS category
			ON category.id = event.category_id AND category.user_id = event.user_id
		WHERE event.user_id = ? AND event.event_date >= CURDATE()
			AND event.deleted_at IS NULL
		ORDER BY event.event_date ASC, event.event_time ASC`,
		[userId],
	);

	return rows.map(mapEvent);
}

async function findByIdAndUser(eventId, userId) {
	const [rows] = await pool.query(
		`SELECT event.id, event.user_id AS userId, event.category_id AS categoryId,
			event.recurrence_frequency AS recurrenceFrequency, event.title, event.description,
			event.event_date AS eventDate, event.location, event.status,
			event.event_time AS eventTime, event.duration,
			category.name AS categoryName, category.description AS categoryDescription,
			category.icon AS categoryIcon, category.color AS categoryColor
		FROM events AS event
		LEFT JOIN categories AS category
			ON category.id = event.category_id AND category.user_id = event.user_id
		WHERE event.id = ? AND event.user_id = ? AND event.deleted_at IS NULL LIMIT 1`,
		[eventId, userId],
	);

	return rows[0] ? mapEvent(rows[0]) : null;
}

async function update(eventId, userId, fields) {
	const columnMap = {
		title: 'title',
		description: 'description',
		eventDate: 'event_date',
		location: 'location',
		status: 'status',
		eventTime: 'event_time',
		duration: 'duration',
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
			values.push(value);
		}
	}

	if (assignments.length === 0) {
		return 0;
	}

	values.push(eventId, userId);

	const [result] = await pool.query(
		`UPDATE events SET ${assignments.join(', ')} WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
		values,
	);

	return result.affectedRows;
}

async function softDelete(eventId, userId) {
	const [result] = await pool.query(
		'UPDATE events SET deleted_at = NOW() WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
		[eventId, userId],
	);

	return result.affectedRows;
}

async function updateStatus(eventId, userId, status) {
	const connection = await pool.getConnection();
	try {
		await connection.beginTransaction();
		const [rows] = await connection.query(
			`SELECT id, category_id AS categoryId, recurrence_frequency AS recurrenceFrequency,
				recurrence_anchor_day AS recurrenceAnchorDay,
				recurrence_anchor_month AS recurrenceAnchorMonth,
				recurrence_advanced AS recurrenceAdvanced, title, description,
				DATE_FORMAT(event_date, '%Y-%m-%d') AS eventDate, location,
				event_time AS eventTime, duration, status
			FROM events WHERE id = ? AND user_id = ? AND deleted_at IS NULL FOR UPDATE`,
			[eventId, userId],
		);
		const event = rows[0];
		if (!event) {
			const error = new Error('Evento no encontrado');
			error.statusCode = 404;
			throw error;
		}
		const wasCompleted = event.status === 'realizado';
		await connection.query(
			'UPDATE events SET status = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
			[status, eventId, userId],
		);
		if (status === 'realizado' && !wasCompleted
			&& !Boolean(event.recurrenceAdvanced) && event.recurrenceFrequency) {
			const nextDate = getNextDate(
				event.eventDate,
				event.recurrenceFrequency,
				Number(event.recurrenceAnchorDay),
				Number(event.recurrenceAnchorMonth),
			);
			await connection.query(
				`INSERT INTO events (
					user_id, category_id, recurrence_frequency, recurrence_anchor_day,
					recurrence_anchor_month, title, description, event_date, location,
					status, event_time, duration
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'programado', ?, ?)`,
				[
					userId,
					event.categoryId,
					event.recurrenceFrequency,
					event.recurrenceAnchorDay,
					event.recurrenceAnchorMonth,
					event.title,
					event.description,
					nextDate,
					event.location,
					event.eventTime,
					event.duration,
				],
			);
			await connection.query(
				'UPDATE events SET recurrence_advanced = 1 WHERE id = ? AND user_id = ?',
				[eventId, userId],
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

function mapEvent(event) {
	const {
		categoryName,
		categoryDescription,
		categoryIcon,
		categoryColor,
		...eventData
	} = event;
	return {
		...eventData,
		category: eventData.categoryId === null ? null : {
			id: eventData.categoryId,
			module: 'events',
			name: categoryName,
			description: categoryDescription,
			icon: categoryIcon,
			color: categoryColor,
		},
	};
}

module.exports = {
	create,
	findAllByUser,
	findUpcomingByUser,
	findByIdAndUser,
	update,
	softDelete,
	updateStatus,
};
