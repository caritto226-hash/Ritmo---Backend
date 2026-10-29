const categorySuggestionService = require('./category-suggestion.service');

async function suggestCategory(req, res, next) {
	try {
		const suggestion = await categorySuggestionService.suggestCategory(req.user.id, req.body.concept);

		return res.status(200).json({ data: { suggestion } });
	} catch (error) {
		return next(error);
	}
}

module.exports = {
	suggestCategory,
};
