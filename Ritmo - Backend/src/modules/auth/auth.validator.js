function validateLogin(req, res, next) {
	const { correo, contraseña } = req.body || {};

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

	req.body.correo = normalizedCorreo;

	return next();
}

function validateForgotPassword(req, res, next) {
	const { correo } = req.body || {};

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

	req.body.correo = normalizedCorreo;

	return next();
}

function validateResetPassword(req, res, next) {
	const { token, nuevaContrasena } = req.body || {};

	if (typeof token !== 'string' || token.trim() === '') {
		const error = new Error('El token es obligatorio');
		error.statusCode = 400;
		return next(error);
	}

	if (typeof nuevaContrasena !== 'string' || nuevaContrasena.length < 6) {
		const error = new Error('La nueva contraseña debe tener al menos 6 caracteres');
		error.statusCode = 400;
		return next(error);
	}

	return next();
}

module.exports = {
	validateLogin,
	validateForgotPassword,
	validateResetPassword,
};