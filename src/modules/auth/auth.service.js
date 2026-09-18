const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authRepository = require('./auth.repository');

async function login(correo, contraseña) {
	const user = await authRepository.findByEmailWithPassword(correo);

	if (!user) {
		const error = new Error('Credenciales inválidas');
		error.statusCode = 401;
		throw error;
	}

	const passwordMatches = await bcrypt.compare(contraseña, user.password_hash);

	if (!passwordMatches) {
		const error = new Error('Credenciales inválidas');
		error.statusCode = 401;
		throw error;
	}

	const payload = {
		id: user.id,
		correo: user.correo,
		idRol: user.id_rol,
	};

	return jwt.sign(payload, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	});
}

module.exports = {
	login,
};