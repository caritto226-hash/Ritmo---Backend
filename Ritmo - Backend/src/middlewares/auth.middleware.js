const jwt = require('jsonwebtoken');
const usersRepository = require('../modules/users/users.repository');

async function verifyToken(req, res, next) {
	const authorizationHeader = req.headers.authorization;

	if (typeof authorizationHeader !== 'string') {
		return res.status(401).json({ message: 'Token de autenticación requerido' });
	}

	const [scheme, token] = authorizationHeader.trim().split(/\s+/);

	if (scheme.toLowerCase() !== 'bearer' || !token) {
		return res.status(401).json({ message: 'Token de autenticación requerido' });
	}

	let payload;

	try {
		payload = jwt.verify(token, process.env.JWT_SECRET);
	} catch (error) {
		return res.status(401).json({ message: 'Token inválido o expirado' });
	}

	try {
		// El token solo es válido si el usuario sigue activo y no cambió su contraseña después de emitirlo.
		const user = await usersRepository.findActiveSessionById(payload.id);

		if (!user || (user.passwordChangedAt !== null && payload.iat < user.passwordChangedAt)) {
			return res.status(401).json({ message: 'Token inválido o expirado' });
		}

		req.user = {
			...payload,
			idRol: user.roleId,
		};

		return next();
	} catch (error) {
		return next(error);
	}
}

module.exports = {
	verifyToken,
};
