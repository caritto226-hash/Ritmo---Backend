const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// Combina IP y correo: frena la fuerza bruta contra una cuenta sin bloquear a toda una red.
function ipAndEmailKey(req) {
	const correo = req.body && typeof req.body.correo === 'string' ? req.body.correo : '';

	return `${ipKeyGenerator(req.ip)}:${correo}`;
}

const loginLimiter = rateLimit({
	windowMs: FIFTEEN_MINUTES,
	limit: 5,
	skipSuccessfulRequests: true,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	keyGenerator: ipAndEmailKey,
	message: { message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos' },
});

const passwordRecoveryLimiter = rateLimit({
	windowMs: FIFTEEN_MINUTES,
	limit: 5,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	message: { message: 'Demasiadas solicitudes de recuperación. Intenta de nuevo en 15 minutos' },
});

module.exports = {
	loginLimiter,
	passwordRecoveryLimiter,
};
