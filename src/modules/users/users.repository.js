const { pool } = require('../../config/mysql');

async function findByEmail(email) {
	const [rows] = await pool.query(
		'SELECT id, name, email, role_id AS roleId FROM users WHERE email = ? LIMIT 1',
		[email],
	);

	return rows[0] || null;
}

async function findRoleById(roleId) {
	const [rows] = await pool.query(
		'SELECT id FROM roles WHERE id = ? LIMIT 1',
		[roleId],
	);

	return rows[0] || null;
}

async function create(userData) {
	const { name, email, passwordHash, roleId } = userData;
	const [result] = await pool.query(
		'INSERT INTO users (name, email, password_hash, registration_date, role_id) VALUES (?, ?, ?, CURDATE(), ?)',
		[name, email, passwordHash, roleId],
	);

	return {
		id: result.insertId,
		name,
		email,
		roleId,
	};
}

async function findAll() {
	const [rows] = await pool.query(
		'SELECT id, name, email, role_id AS roleId FROM users WHERE deleted_at IS NULL'
	);
	return rows;
}

async function findById(id) {
	const [rows] = await pool.query(
		'SELECT id, name, email, role_id AS roleId FROM users WHERE id = ? AND deleted_at IS NULL',
		[id]
	);
	return rows[0] || null;
}

async function findByEmailWithPassword(email) {
	const [rows] = await pool.query(
		'SELECT id, name, email, password_hash, role_id FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1',
		[email],
	);

	return rows[0] || null;
}

async function findByEmailExcludingId(email, id) {
	const [rows] = await pool.query(
		'SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL',
		[email, id]
	);
	return rows[0] || null;
}

async function update(id, data) {
	const { name, email, roleId } = data;

	await pool.query(
		'UPDATE users SET name = ?, email = ?, role_id = ? WHERE id = ?',
		[name, email, roleId, id]
	);

	const [rows] = await pool.query(
		'SELECT id, name, email, role_id AS roleId FROM users WHERE id = ?',
		[id]
	);
	return rows[0];
}

async function updatePassword(userId, newPasswordHash) {
	await pool.query(
		'UPDATE users SET password_hash = ? WHERE id = ?',
		[newPasswordHash, userId]
	);
}

async function changeStatus(id, status) {
	await pool.query(
		'UPDATE users SET status = ? WHERE id = ?',
		[status, id]
	);
}

async function softDelete(id) {
	await pool.query(
		'UPDATE users SET status = 0, deleted_at = NOW() WHERE id = ?',
		[id]
	);
}

async function findActiveByEmail(email) {
	const [rows] = await pool.query(
		'SELECT id, name, email, role_id AS roleId FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1',
		[email],
	);

	return rows[0] || null;
}

module.exports = {
	findByEmail,
	findRoleById,
	create,
	findAll,
	findById,
	findByEmailExcludingId,
	update,
	updatePassword,
	changeStatus,
	softDelete,
	findByEmailWithPassword,
	findActiveByEmail,
};