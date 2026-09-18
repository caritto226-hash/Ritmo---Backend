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

module.exports = {
	login,
};