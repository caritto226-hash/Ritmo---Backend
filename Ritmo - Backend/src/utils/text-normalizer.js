// Deja el texto listo para comparar o clasificar: minúsculas, sin tildes, sin números,
// sin puntuación y con un solo espacio entre palabras. La ñ pasa a n.
function normalizeText(text) {
	if (typeof text !== 'string') {
		return '';
	}

	return text
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

module.exports = {
	normalizeText,
};
