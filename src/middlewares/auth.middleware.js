const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
	const authorizationHeader = req.headers.authorization;

	if (typeof authorizationHeader !== 'string') {
		return res.status(401).json({ message: 'Token de autenticación requerido' });
	}

	const [scheme, token] = authorizationHeader.trim().split(/\s+/);

	if (scheme.toLowerCase() !== 'bearer' || !token) {
		return res.status(401).json({ message: 'Token de autenticación requerido' });
	}

	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		req.user = payload;

		return next();
	} catch (error) {
		return res.status(401).json({ message: 'Token inválido o expirado' });
	}
}

module.exports = {
	verifyToken,
};