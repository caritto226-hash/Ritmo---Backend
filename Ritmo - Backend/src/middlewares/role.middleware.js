function requireRole(rolPermitido) {
	return function roleMiddleware(req, res, next) {
		if (!req.user || req.user.idRol !== rolPermitido) {
			return res.status(403).json({ message: 'Acceso prohibido' });
		}

		return next();
	};
}

function requireSelfOrRole(rolPermitido) {
	return function selfOrRoleMiddleware(req, res, next) {
		const isSelf = req.user && req.user.id === Number(req.params.id);

		if (!req.user || (!isSelf && req.user.idRol !== rolPermitido)) {
			return res.status(403).json({ message: 'Acceso prohibido' });
		}

		return next();
	};
}

module.exports = {
	requireRole,
	requireSelfOrRole,
};