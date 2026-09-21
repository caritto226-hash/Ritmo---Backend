const authService = require('./auth.service');

async function login(req, res, next) {
	try {
		const { correo, contraseña } = req.body;
		const token = await authService.login(correo, contraseña);

		return res.status(200).json({ token });
	} catch (error) {
		return next(error);
	}
}

async function forgotPassword(req, res, next) {
	try {
		const { correo } = req.body;
		const token = await authService.forgotPassword(correo);
		const response = {
			message: 'Si el correo existe, recibirás instrucciones de recuperación',
		};

		if (token) {
			response.token = token;
		}

		return res.status(200).json(response);
	} catch (error) {
		return next(error);
	}
}

async function resetPassword(req, res, next) {
	try {
		const { token, nuevaContrasena } = req.body;
		await authService.resetPassword(token, nuevaContrasena);

		return res.status(200).json({
			message: 'Contraseña actualizada correctamente',
		});
	} catch (error) {
		return next(error);
	}
}

module.exports = {
	login,
	forgotPassword,
	resetPassword,
};