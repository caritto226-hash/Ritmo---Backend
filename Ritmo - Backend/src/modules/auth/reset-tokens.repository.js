const { pool } = require('../../config/mysql');

async function invalidateAllTokensForUser(idUsuario) {
	await pool.query(
		'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
		[idUsuario],
	);
}

async function createToken(idUsuario, tokenHash, expiresAt) {
	const [result] = await pool.query(
		'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
		[idUsuario, tokenHash, expiresAt],
	);

	return result.insertId;
}

async function findValidToken(tokenHash) {
	const [rows] = await pool.query(
		'SELECT id, user_id, token_hash, expires_at, used_at FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1',
		[tokenHash],
	);

	return rows[0] || null;
}

async function markTokenAsUsed(id) {
	await pool.query(
		'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?',
		[id],
	);
}

module.exports = {
	invalidateAllTokensForUser,
	createToken,
	findValidToken,
	markTokenAsUsed,
};
