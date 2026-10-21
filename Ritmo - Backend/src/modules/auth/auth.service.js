const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authRepository = require('./auth.repository');
const usersRepository = require('../users/users.repository');
const resetTokensRepository = require('./reset-tokens.repository');

// Hash de una contraseña ficticia: se compara cuando el correo no existe para que el login tarde lo mismo.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('ritmo-contrasena-ficticia', 10);

async function login(correo, contraseña) {
	const user = await authRepository.findByEmailWithPassword(correo);
	const passwordMatches = await bcrypt.compare(contraseña, user ? user.password_hash : DUMMY_PASSWORD_HASH);

	if (!user || !passwordMatches) {
		const error = new Error('Credenciales inválidas');
		error.statusCode = 401;
		throw error;
	}

	const payload = {
	id: user.id,
	correo: user.email,
	idRol: user.role_id,
	};

	return jwt.sign(payload, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	});
}

async function forgotPassword(correo) {
	const user = await usersRepository.findActiveByEmail(correo);

	if (!user) {
		return;
	}

	await resetTokensRepository.invalidateAllTokensForUser(user.id);

	const token = crypto.randomBytes(32).toString('hex');
	const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
	const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

	await resetTokensRepository.createToken(user.id, tokenHash, expiresAt);

	// El token nunca viaja en la respuesta HTTP. Mientras no haya envío de correos,
	// solo se muestra en la consola del servidor en desarrollo para poder probar el flujo.
	if (process.env.NODE_ENV === 'development') {
		console.info(`[forgot-password] Token de recuperación para el usuario ${user.id}: ${token}`);
	}
}

async function resetPassword(token, nuevaContrasena) {
	const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
	const resetToken = await resetTokensRepository.findValidToken(tokenHash);

	if (!resetToken) {
		const error = new Error('Token inválido o expirado');
		error.statusCode = 400;
		throw error;
	}

	const passwordHash = await bcrypt.hash(nuevaContrasena, 10);

	await usersRepository.updatePassword(resetToken.user_id, passwordHash);
	await resetTokensRepository.markTokenAsUsed(resetToken.id);
}

module.exports = {
	login,
	forgotPassword,
	resetPassword,
};