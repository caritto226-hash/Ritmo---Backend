// Coincide con expenses.concept VARCHAR(100).
const MAX_CONCEPT_LENGTH = 100;

function validateSuggestCategory(req, res, next) {
	const { concept } = req.body || {};

	// Los mensajes nunca incluyen el concepto: no debe quedar en respuestas de error ni en logs.
	if (typeof concept !== 'string' || concept.trim() === '') {
		const error = new Error('El concepto es obligatorio');
		error.statusCode = 400;
		return next(error);
	}

	if (concept.trim().length > MAX_CONCEPT_LENGTH) {
		const error = new Error(`El concepto no puede superar los ${MAX_CONCEPT_LENGTH} caracteres`);
		error.statusCode = 400;
		return next(error);
	}

	req.body.concept = concept.trim();

	return next();
}

module.exports = {
	validateSuggestCategory,
};
