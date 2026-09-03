function validateCreateUser(req, res, next) {
	const { nombre, correo, contraseña, idRol } = req.body || {};

	if (typeof nombre !== 'string' || nombre.trim() === '') {
		const error = new Error('El nombre es obligatorio');
		error.statusCode = 400;
		return next(error);
	}

	if (typeof correo !== 'string' || correo.trim() === '') {
		const error = new Error('El correo es obligatorio');
		error.statusCode = 400;
		return next(error);
	}

	const normalizedCorreo = correo.trim().toLowerCase();
	const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	if (!emailPattern.test(normalizedCorreo)) {
		const error = new Error('El correo no tiene un formato válido');
		error.statusCode = 400;
		return next(error);
	}

	if (typeof contraseña !== 'string' || contraseña.length === 0) {
		const error = new Error('La contraseña es obligatoria');
		error.statusCode = 400;
		return next(error);
	}

	if (contraseña.length < 6) {
		const error = new Error('La contraseña debe tener mínimo seis caracteres');
		error.statusCode = 400;
		return next(error);
	}

	if (idRol === undefined || idRol === null || idRol === '') {
		const error = new Error('El rol es obligatorio');
		error.statusCode = 400;
		return next(error);
	}

	const normalizedIdRol = Number(idRol);

	if (!Number.isInteger(normalizedIdRol) || normalizedIdRol <= 0) {
		const error = new Error('El rol debe ser un entero positivo');
		error.statusCode = 400;
		return next(error);
	}

	req.body.nombre = nombre.trim();
	req.body.correo = normalizedCorreo;
	req.body.idRol = normalizedIdRol;

	next();
}

module.exports = {
	validateCreateUser,
};
