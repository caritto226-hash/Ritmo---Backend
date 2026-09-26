const { pool } = require('../../config/mysql');

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
	} = eventData;

	const [result] = await pool.query(
		'INSERT INTO events (user_id, title, description, event_date, location, status, event_time, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
		[userId, title, description, eventDate, location, status, eventTime, duration],
	);

	return findByIdAndUser(result.insertId, userId);
}

async function findAllByUser(userId) {
	const [rows] = await pool.query(
		'SELECT id, user_id AS userId, title, description, event_date AS eventDate, location, status, event_time AS eventTime, duration FROM events WHERE user_id = ? AND deleted_at IS NULL ORDER BY event_date ASC, event_time ASC',
		[userId],
	);

	return rows;
}

async function findUpcomingByUser(userId) {
	const [rows] = await pool.query(
		'SELECT id, user_id AS userId, title, description, event_date AS eventDate, location, status, event_time AS eventTime, duration FROM events WHERE user_id = ? AND event_date >= CURDATE() AND deleted_at IS NULL ORDER BY event_date ASC, event_time ASC',
		[userId],
	);

	return rows;
}

async function findByIdAndUser(eventId, userId) {
	const [rows] = await pool.query(
		'SELECT id, user_id AS userId, title, description, event_date AS eventDate, location, status, event_time AS eventTime, duration FROM events WHERE id = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1',
		[eventId, userId],
	);

	return rows[0] || null;
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

module.exports = {
	create,
	findAllByUser,
	findUpcomingByUser,
	findByIdAndUser,
	update,
	softDelete,
};
