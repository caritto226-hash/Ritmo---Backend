const { pool } = require('../../config/mysql');

async function findByEmail(correo) {
	const [rows] = await pool.query(
		'SELECT id, nombre, correo, id_rol FROM users WHERE correo = ? LIMIT 1',
		[correo],
	);

	return rows[0] || null;
}

async function findRoleById(idRol) {
	const [rows] = await pool.query(
		'SELECT id FROM roles WHERE id = ? LIMIT 1',
		[idRol],
	);

	return rows[0] || null;
}

async function create(userData) {
	const { nombre, correo, passwordHash, idRol } = userData;
	const [result] = await pool.query(
		'INSERT INTO users (nombre, correo, password_hash, id_rol) VALUES (?, ?, ?, ?)',
		[nombre, correo, passwordHash, idRol],
	);

	return {
		id: result.insertId,
		nombre,
		correo,
		idRol,
	};
}

module.exports = {
	findByEmail,
	findRoleById,
	create,
};
