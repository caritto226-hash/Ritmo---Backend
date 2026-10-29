const fs = require('fs');
const path = require('path');
const natural = require('natural');
const categorySuggestionRepository = require('./category-suggestion.repository');
const { stemmer, toFeatures } = require('../../utils/category-features');
const { normalizeText } = require('../../utils/text-normalizer');

// El modelo lo genera "npm run ml:train". Es un archivo de datos: no se importa código de ml/.
const MODEL_PATH = path.join(__dirname, '..', '..', '..', 'ml', 'models', 'finance-category-model.json');
const MIN_CONFIDENCE = 0.6;

// Se carga una sola vez, al iniciar. Si falta o está dañado, el servidor arranca igual
// y el endpoint responde 503.
const model = loadModel();

function loadModel() {
	try {
		const classifier = natural.BayesClassifier.restore(
			JSON.parse(fs.readFileSync(MODEL_PATH, 'utf8')),
			stemmer,
		);
		const classTotals = classifier.classifier && classifier.classifier.classTotals;

		if (!classifier.features || !classTotals || Object.keys(classTotals).length === 0) {
			throw new Error('el archivo no tiene la estructura de un modelo entrenado');
		}

		// Comprueba que el modelo restaurado puede clasificar antes de aceptarlo.
		classifier.getClassifications([]);

		return {
			classifier,
			knownFeatures: new Set(Object.keys(classifier.features)),
		};
	} catch (error) {
		console.warn(`Sugeridor de categorías no disponible: no se pudo cargar el modelo (${error.message})`);
		return null;
	}
}

async function suggestCategory(userId, concept) {
	if (!Number.isInteger(userId) || userId <= 0) {
		const error = new Error('El usuario autenticado no es válido');
		error.statusCode = 401;
		throw error;
	}

	if (!model) {
		const error = new Error('El sugeridor de categorías no está disponible en este momento');
		error.statusCode = 503;
		throw error;
	}

	const features = toFeatures(concept);

	// Sin ninguna palabra conocida todas las categorías empatan: no hay nada que sugerir.
	if (!features.some((feature) => model.knownFeatures.has(feature))) {
		return null;
	}

	const classifications = model.classifier.getClassifications(features);
	const total = classifications.reduce((sum, classification) => sum + classification.value, 0);

	if (!(total > 0)) {
		return null;
	}

	const [best] = classifications;
	const confidence = best.value / total;

	if (confidence < MIN_CONFIDENCE) {
		return null;
	}

	// Si la persona desactivó o renombró la categoría, no se encuentra y no se sugiere nada.
	const categories = await categorySuggestionRepository.findActiveFinanceCategories(userId);
	const suggestedName = normalizeText(best.label);
	const category = categories.find((item) => normalizeText(item.name) === suggestedName);

	if (!category) {
		return null;
	}

	return {
		categoryId: category.id,
		name: category.name,
		confidence: Math.round(confidence * 100) / 100,
	};
}

module.exports = {
	suggestCategory,
};
