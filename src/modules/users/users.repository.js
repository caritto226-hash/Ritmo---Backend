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
		'INSERT INTO users (nombre, correo, password_hash, fecha_registro, id_rol) VALUES (?, ?, ?, CURDATE(), ?)',
		[nombre, correo, passwordHash, idRol],
	);

	return {
		id: result.insertId,
		nombre,
		correo,
		idRol,
	};
}

async function findAll() {
  const [rows] = await pool.query(
    'SELECT id, nombre, correo, id_rol FROM users WHERE deleted_at IS NULL'
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, nombre, correo, id_rol FROM users WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return rows[0] || null;
}

async function findByEmailExcludingId(correo, id) {
  const [rows] = await pool.query(
    'SELECT id FROM users WHERE correo = ? AND id != ? AND deleted_at IS NULL',
    [correo, id]
  );
  return rows[0] || null;
}

async function update(id, data) {
  const { nombre, correo, idRol } = data;

  await pool.query(
    'UPDATE users SET nombre = ?, correo = ?, id_rol = ? WHERE id = ?',
    [nombre, correo, idRol, id]
  );

  const [rows] = await pool.query(
    'SELECT id, nombre, correo, id_rol FROM users WHERE id = ?',
    [id]
  );
  return rows[0];
}

async function changeStatus(id, status) {
  await pool.query(
    'UPDATE users SET estado = ? WHERE id = ?',
    [status, id]
  );
}


async function softDelete(id) {
  await pool.query(
    'UPDATE users SET estado = 0, deleted_at = NOW() WHERE id = ?',
    [id]
  );
}


module.exports = {
	findByEmail,
	findRoleById,
	create,
	findAll,
	findById,
	findByEmailExcludingId,
	update,
	changeStatus,
	softDelete,
};
