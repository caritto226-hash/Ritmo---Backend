// Convierte un concepto financiero en las características que usa el sugeridor de categorías.
// La usan el script de entrenamiento (ml/train-category-model.js) y la API, así que cualquier
// cambio aquí obliga a volver a entrenar con npm run ml:train.
const natural = require('natural');
const spanishStopwords = require('natural/lib/natural/util/stopwords_es').words;
const { normalizeText } = require('./text-normalizer');

const stemmer = natural.PorterStemmerEs;
// Los pronombres separan "me debe" (Cuentas por cobrar) de "le debo" (Deudas y créditos),
// así que no se descartan aunque estén en la lista de palabras vacías.
const KEPT_PRONOUNS = new Set(['me', 'le', 'les', 'te', 'nos', 'mi', 'mis']);
const STOPWORDS = new Set(spanishStopwords.filter((word) => !KEPT_PRONOUNS.has(word)));
// El stemmer reduce "debo", "debe" y "deben" a "deb" y se pierde quién debe a quién.
// Las formas de "deber" (y sus errores comunes con v) se dejan completas.
const UNSTEMMED_ROOTS = new Set(['deb', 'dev']);

function toFeatures(text) {
	const normalizedText = normalizeText(text);

	if (normalizedText === '') {
		return [];
	}

	return normalizedText
		.split(' ')
		.filter((word) => !STOPWORDS.has(word))
		.map((word) => {
			const stem = stemmer.stem(word);

			return KEPT_PRONOUNS.has(word) || UNSTEMMED_ROOTS.has(stem) ? word : stem;
		});
}

module.exports = {
	stemmer,
	toFeatures,
};
