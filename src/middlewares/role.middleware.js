function requireRole(rolPermitido) {
	return function roleMiddleware(req, res, next) {
		if (!req.user || req.user.idRol !== rolPermitido) {
			return res.status(403).json({ message: 'Acceso prohibido' });
		}

		return next();
	};
}

module.exports = {
	requireRole,
};