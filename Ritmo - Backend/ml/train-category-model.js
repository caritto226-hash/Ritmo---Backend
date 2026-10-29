// Entrena el sugeridor de categorías de finanzas con los conceptos de ml/data/finance-concepts.json.
// Uso: npm run ml:train
const fs = require('fs');
const path = require('path');
const natural = require('natural');
const { normalizeText } = require('../src/utils/text-normalizer');
const { stemmer, toFeatures } = require('../src/utils/category-features');

const DATA_PATH = path.join(__dirname, 'data', 'finance-concepts.json');
const MODEL_PATH = path.join(__dirname, 'models', 'finance-category-model.json');
const SEED = 42;
const TRAIN_RATIO = 0.8;

// Generador pseudoaleatorio con semilla (mulberry32) para que la separación sea siempre la misma.
function createRandom(seed) {
	let state = seed;

	return function random() {
		state = (state + 0x6D2B79F5) | 0;
		let value = Math.imul(state ^ (state >>> 15), 1 | state);
		value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;

		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

function shuffle(items, random) {
	const shuffled = [...items];

	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}

	return shuffled;
}

function loadExamples() {
	const { categories, examples } = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
	const seen = new Map();
	const unique = [];
	const conflicts = [];

	for (const { concept, category } of examples) {
		const text = normalizeText(concept);

		if (text === '') {
			continue;
		}

		if (seen.has(text)) {
			if (seen.get(text) !== category) {
				conflicts.push(`"${concept}" (${category} y ${seen.get(text)})`);
			}
			continue;
		}

		seen.set(text, category);
		unique.push({ concept, text, category });
	}

	return { categories, unique, removed: examples.length - unique.length, conflicts };
}

function splitByCategory(examples, categories, random) {
	const train = [];
	const test = [];

	for (const category of categories) {
		const shuffled = shuffle(examples.filter((example) => example.category === category), random);
		const trainSize = Math.round(shuffled.length * TRAIN_RATIO);

		train.push(...shuffled.slice(0, trainSize));
		test.push(...shuffled.slice(trainSize));
	}

	return { train, test };
}

function trainClassifier(examples) {
	const classifier = new natural.BayesClassifier(stemmer);

	for (const { text, category } of examples) {
		classifier.addDocument(toFeatures(text), category);
	}

	classifier.train();

	return classifier;
}

function percent(hits, total) {
	return `${((hits / total) * 100).toFixed(1)} %`;
}

function evaluate(classifier, test, categories) {
	const perCategory = Object.fromEntries(categories.map((category) => [category, { hits: 0, total: 0 }]));
	const confusions = new Map();
	let hits = 0;

	for (const example of test) {
		const predicted = classifier.classify(toFeatures(example.text));
		perCategory[example.category].total++;

		if (predicted === example.category) {
			hits++;
			perCategory[example.category].hits++;
			continue;
		}

		const pair = [example.category, predicted].sort().join(' ↔ ');
		if (!confusions.has(pair)) {
			confusions.set(pair, []);
		}
		confusions.get(pair).push(`"${example.concept}": era ${example.category}, sugirió ${predicted}`);
	}

	console.log(`\nAciertos en el ${Math.round((1 - TRAIN_RATIO) * 100)} % de prueba: ${percent(hits, test.length)} (${hits} de ${test.length})`);
	for (const category of categories) {
		const { hits: categoryHits, total } = perCategory[category];
		console.log(`  ${category.padEnd(26)} ${percent(categoryHits, total).padStart(7)} (${categoryHits}/${total})`);
	}

	const topConfusions = [...confusions.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 3);
	console.log('\nParejas de categorías que más se confunden:');
	for (const [pair, errors] of topConfusions) {
		console.log(`  ${pair}: ${errors.length} errores`);
		errors.slice(0, 2).forEach((error) => console.log(`    - ${error}`));
	}
}

function main() {
	const { categories, unique, removed, conflicts } = loadExamples();
	console.log(`Ejemplos únicos: ${unique.length} (se quitaron ${removed} duplicados después de normalizar)`);
	if (conflicts.length > 0) {
		console.log(`Duplicados con categorías distintas (se dejó la primera): ${conflicts.join('; ')}`);
	}

	const { train, test } = splitByCategory(unique, categories, createRandom(SEED));
	console.log(`Entrenamiento: ${train.length} | Prueba: ${test.length} | Semilla: ${SEED}`);
	evaluate(trainClassifier(train), test, categories);

	const finalClassifier = trainClassifier(unique);
	fs.mkdirSync(path.dirname(MODEL_PATH), { recursive: true });
	fs.writeFileSync(MODEL_PATH, JSON.stringify(finalClassifier));

	const sizeKb = (fs.statSync(MODEL_PATH).size / 1024).toFixed(1);
	console.log(`\nModelo final entrenado con ${unique.length} ejemplos y guardado en ${path.relative(process.cwd(), MODEL_PATH)} (${sizeKb} KB)`);
}

main();
