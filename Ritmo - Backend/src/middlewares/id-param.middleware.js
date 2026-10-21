// Se registra con router.param('id', validateIdParam): solo acepta enteros positivos en decimal.
// Evita que Number() convierta valores como "0x2b" o "1e1" en identificadores válidos.
function validateIdParam(req, res, next, value) {
	if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) {
		const error = new Error('El identificador no es válido');
		error.statusCode = 400;
		return next(error);
	}

	return next();
}

module.exports = {
	validateIdParam,
};
