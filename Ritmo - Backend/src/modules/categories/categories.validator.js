const allowedModules = new Set(['finance', 'tasks', 'habits', 'events']);
const allowedIcons = new Set([
	'wallet',
	'circle-dollar-sign',
	'house',
	'shopping-bag',
	'coffee',
	'receipt',
	'credit-card',
	'piggy-bank',
	'landmark',
	'briefcase',
	'circle-help',
	'tag',
	'heart',
	'calendar-days',
	'target',
	'book-open',
	'list-checks',
	'wrench',
	'heart-pulse',
	'clipboard-list',
]);

function validateCategoryModule(req, res, next) {
	const { module } = req.query;

	if (typeof module !== 'string' || !allowedModules.has(module)) {
		return next(createError('El módulo es obligatorio y debe ser finance, tasks, habits o events'));
	}

	return next();
}

function validateCreateCategory(req, res, next) {
	const { module, name, description, icon, color, isRecurring = false } = req.body || {};

	if (typeof module !== 'string' || !allowedModules.has(module)) {
		return next(createError('El módulo debe ser finance, tasks, habits o events'));
	}

	const normalizedName = validateName(name);
	if (normalizedName instanceof Error) {
		return next(normalizedName);
	}

	if (typeof icon !== 'string' || !allowedIcons.has(icon)) {
		return next(createError('El icono no pertenece a la lista de iconos permitidos'));
	}

	if (!isValidColor(color)) {
		return next(createError('El color debe tener formato hexadecimal #RRGGBB'));
	}

	if (!isValidDescription(description)) {
		return next(createError('La descripción debe ser texto de hasta 250 caracteres'));
	}

	if (typeof isRecurring !== 'boolean') {
		return next(createError('isRecurring debe ser un valor booleano'));
	}

	req.body = {
		module,
		name: normalizedName,
		description: description?.trim() || null,
		icon,
		color: color.toUpperCase(),
		isRecurring,
	};

	return next();
}

function validateUpdateCategory(req, res, next) {
	const { name, description, icon, color, isRecurring } = req.body || {};
	const updateData = {};

	if (name !== undefined) {
		const normalizedName = validateName(name);
		if (normalizedName instanceof Error) {
			return next(normalizedName);
		}

		updateData.name = normalizedName;
	}

	if (icon !== undefined) {
		if (typeof icon !== 'string' || !allowedIcons.has(icon)) {
			return next(createError('El icono no pertenece a la lista de iconos permitidos'));
		}

		updateData.icon = icon;
	}

	if (description !== undefined) {
		if (!isValidDescription(description)) {
			return next(createError('La descripción debe ser texto de hasta 250 caracteres'));
		}

		updateData.description = description?.trim() || null;
	}

	if (color !== undefined) {
		if (!isValidColor(color)) {
			return next(createError('El color debe tener formato hexadecimal #RRGGBB'));
		}

		updateData.color = color.toUpperCase();
	}

	if (isRecurring !== undefined) {
		if (typeof isRecurring !== 'boolean') {
			return next(createError('isRecurring debe ser un valor booleano'));
		}
		updateData.isRecurring = isRecurring;
	}

	if (Object.keys(updateData).length === 0) {
		return next(createError('Debe proporcionar al menos un campo válido para actualizar'));
	}

	req.body = updateData;
	return next();
}

function validateName(name) {
	if (typeof name !== 'string') {
		return createError('El nombre es obligatorio y debe ser texto');
	}

	const trimmedName = name.trim();
	if (trimmedName === '' || Array.from(trimmedName).length > 100) {
		return createError('El nombre es obligatorio y no puede superar los 100 caracteres');
	}

	return trimmedName;
}

function isValidColor(color) {
	return typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color);
}

function isValidDescription(description) {
	return description === undefined
		|| description === null
		|| (typeof description === 'string' && description.length <= 250);
}

function createError(message) {
	const error = new Error(message);
	error.statusCode = 400;
	return error;
}

module.exports = {
	validateCategoryModule,
	validateCreateCategory,
	validateUpdateCategory,
};
