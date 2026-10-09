const categoriesRepository = require('./categories.repository');

const allowedModules = new Set(['finance', 'tasks', 'habits', 'events']);

async function getCategories(userId, module) {
	validateUserId(userId);
	validateModule(module);

	return categoriesRepository.findAllByUserAndModule(userId, module);
}

async function createCategory(userId, categoryData) {
	validateUserId(userId);
	validateModule(categoryData.module);

	const name = normalizeDisplayName(categoryData.name);
	const normalizedName = normalizeCategoryName(name);

	if (await categoriesRepository.findByNormalizedName(userId, categoryData.module, normalizedName)) {
		throw conflictError();
	}

	try {
		return await categoriesRepository.create({
			userId,
			module: categoryData.module,
			name,
			description: categoryData.description,
			normalizedName,
			icon: categoryData.icon,
			color: categoryData.color,
			isRecurring: categoryData.isRecurring,
		});
	} catch (error) {
		if (error.code === 'ER_DUP_ENTRY') {
			throw conflictError();
		}

		throw error;
	}
}

async function getCategoryById(categoryId, userId) {
	validateIds(categoryId, userId);

	const category = await categoriesRepository.findByIdAndUser(categoryId, userId);
	if (!category) {
		throw notFoundError();
	}

	return category;
}

async function updateCategory(categoryId, userId, data) {
	const category = await getCategoryById(categoryId, userId);
	const fields = {};

	if (Object.prototype.hasOwnProperty.call(data, 'name')) {
		const name = normalizeDisplayName(data.name);
		const normalizedName = normalizeCategoryName(name);

		if (await categoriesRepository.findByNormalizedName(
			userId,
			category.module,
			normalizedName,
			categoryId,
		)) {
			throw conflictError();
		}

		fields.name = name;
		fields.normalizedName = normalizedName;
	}

	if (Object.prototype.hasOwnProperty.call(data, 'icon')) {
		fields.icon = data.icon;
	}

	if (Object.prototype.hasOwnProperty.call(data, 'description')) {
		fields.description = data.description;
	}

	if (Object.prototype.hasOwnProperty.call(data, 'color')) {
		fields.color = data.color;
	}

	if (Object.prototype.hasOwnProperty.call(data, 'isRecurring')) {
		fields.isRecurring = data.isRecurring;
	}

	try {
		const updatedCategory = await categoriesRepository.update(categoryId, userId, fields);
		if (!updatedCategory) {
			throw notFoundError();
		}

		return updatedCategory;
	} catch (error) {
		if (error.code === 'ER_DUP_ENTRY') {
			throw conflictError();
		}

		throw error;
	}
}

async function deleteCategory(categoryId, userId) {
	validateIds(categoryId, userId);

	const affectedRows = await categoriesRepository.deactivate(categoryId, userId);
	if (affectedRows === 0) {
		throw notFoundError();
	}
}

function validateUserId(userId) {
	if (!Number.isInteger(userId) || userId <= 0) {
		const error = new Error('El usuario autenticado no es válido');
		error.statusCode = 401;
		throw error;
	}
}

function validateIds(categoryId, userId) {
	if (!Number.isInteger(categoryId) || categoryId <= 0) {
		const error = new Error('El identificador de categoría no es válido');
		error.statusCode = 400;
		throw error;
	}

	validateUserId(userId);
}

function validateModule(module) {
	if (!allowedModules.has(module)) {
		const error = new Error('El módulo debe ser finance, tasks, habits o events');
		error.statusCode = 400;
		throw error;
	}
}

function normalizeDisplayName(name) {
	return name.trim();
}

function normalizeCategoryName(name) {
	return name.trim().toLowerCase();
}

function notFoundError() {
	const error = new Error('Categoría no encontrada');
	error.statusCode = 404;
	return error;
}

function conflictError() {
	const error = new Error('Ya existe una categoría con ese nombre en el módulo');
	error.statusCode = 409;
	return error;
}

module.exports = {
	getCategories,
	createCategory,
	getCategoryById,
	updateCategory,
	deleteCategory,
};
