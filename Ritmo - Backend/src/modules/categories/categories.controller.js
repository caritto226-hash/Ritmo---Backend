const categoriesService = require('./categories.service');

async function getCategories(req, res, next) {
	try {
		const categories = await categoriesService.getCategories(req.user.id, req.query.module);

		return res.status(200).json({ data: categories });
	} catch (error) {
		return next(error);
	}
}

async function createCategory(req, res, next) {
	try {
		const category = await categoriesService.createCategory(req.user.id, req.body);

		return res.status(201).json({ data: category });
	} catch (error) {
		return next(error);
	}
}

async function getCategoryById(req, res, next) {
	try {
		const category = await categoriesService.getCategoryById(Number(req.params.id), req.user.id);

		return res.status(200).json({ data: category });
	} catch (error) {
		return next(error);
	}
}

async function updateCategory(req, res, next) {
	try {
		const category = await categoriesService.updateCategory(
			Number(req.params.id),
			req.user.id,
			req.body,
		);

		return res.status(200).json({ data: category });
	} catch (error) {
		return next(error);
	}
}

async function deleteCategory(req, res, next) {
	try {
		await categoriesService.deleteCategory(Number(req.params.id), req.user.id);

		return res.status(200).json({ message: 'Categoría desactivada correctamente' });
	} catch (error) {
		return next(error);
	}
}

module.exports = {
	getCategories,
	createCategory,
	getCategoryById,
	updateCategory,
	deleteCategory,
};
