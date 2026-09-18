const { pool } = require('../../config/mysql');

async function findByEmailWithPassword(correo) {
	const [rows] = await pool.query(
		'SELECT id, nombre, correo, password_hash, id_rol FROM users WHERE correo = ? AND deleted_at IS NULL LIMIT 1',
		[correo],
	);

	return rows[0] || null;
}

module.exports = {
	findByEmailWithPassword,
};