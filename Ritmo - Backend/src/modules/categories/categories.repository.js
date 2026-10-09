const { pool } = require('../../config/mysql');

const defaultCategories = {
	finance: [
		{ name: 'Ingresos', icon: 'circle-dollar-sign', color: '#2E7D32' },
		{ name: 'Gastos fijos', icon: 'house', color: '#1565C0' },
		{ name: 'Gastos variables', icon: 'shopping-bag', color: '#EF6C00' },
		{ name: 'Gastos Hormiga', icon: 'coffee', color: '#F9A825' },
		{ name: 'Cuentas por cobrar', icon: 'receipt', color: '#00897B' },
	],
	tasks: [
		{
			name: 'Top 3 del día',
			description: 'Innegociables del día',
			icon: 'target',
			color: '#C62828',
		},
		{
			name: 'Secundarias',
			description: 'Puede reprogramarse',
			icon: 'list-checks',
			color: '#1565C0',
		},
		{
			name: 'Mantenimiento',
			description: 'Tareas mecánicas o repetitivas',
			icon: 'wrench',
			color: '#6D4C41',
		},
	],
	habits: [
		{
			name: 'Salud y bienestar',
			description: 'Hábitos para cuidar la salud física y emocional',
			icon: 'heart-pulse',
			color: '#2E7D32',
		},
		{
			name: 'Crecimiento',
			description: 'Hábitos de aprendizaje y desarrollo personal',
			icon: 'book-open',
			color: '#1565C0',
		},
		{
			name: 'Administrativo',
			description: 'Gestiones y organización personal',
			icon: 'clipboard-list',
			color: '#EF6C00',
		},
	],
};

async function create(categoryData) {
	const {
		userId,
		module,
		name,
		description,
		normalizedName,
		icon,
		color,
		isRecurring = false,
	} = categoryData;
	const [result] = await pool.query(
		`INSERT INTO categories
			(user_id, module, name, description, normalized_name, icon, color, is_recurring)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		[userId, module, name, description, normalizedName, icon, color, isRecurring ? 1 : 0],
	);

	return findByIdAndUser(result.insertId, userId);
}

async function findAllByUserAndModule(userId, module) {
	if (defaultCategories[module]) {
		await ensureDefaultCategories(userId, module);
	}

	const [rows] = await pool.query(
		`SELECT id, user_id AS userId, module, name, description, icon, color,
			is_recurring AS isRecurring,
			is_default AS isDefault, is_active AS isActive,
			created_at AS createdAt, updated_at AS updatedAt
		FROM categories
		WHERE user_id = ? AND module = ? AND is_active = 1 AND deleted_at IS NULL
		ORDER BY is_default DESC, name ASC`,
		[userId, module],
	);

	return rows.map(mapCategory);
}

async function findByIdAndUser(categoryId, userId) {
	const [rows] = await pool.query(
		`SELECT id, user_id AS userId, module, name, description, icon, color,
			is_recurring AS isRecurring,
			is_default AS isDefault, is_active AS isActive,
			created_at AS createdAt, updated_at AS updatedAt
		FROM categories
		WHERE id = ? AND user_id = ? AND is_active = 1 AND deleted_at IS NULL
		LIMIT 1`,
		[categoryId, userId],
	);

	return rows[0] ? mapCategory(rows[0]) : null;
}

async function findByNormalizedName(userId, module, normalizedName, excludedCategoryId = null) {
	const [rows] = await pool.query(
		`SELECT id FROM categories
		WHERE user_id = ? AND module = ? AND normalized_name = ?
			AND (? IS NULL OR id != ?)
		LIMIT 1`,
		[userId, module, normalizedName, excludedCategoryId, excludedCategoryId],
	);

	return rows[0] || null;
}

async function update(categoryId, userId, fields) {
	const columnMap = {
		name: 'name',
		description: 'description',
		normalizedName: 'normalized_name',
		icon: 'icon',
		color: 'color',
		isRecurring: 'is_recurring',
	};
	const assignments = [];
	const values = [];

	for (const [field, value] of Object.entries(fields)) {
		const column = columnMap[field];
		if (column) {
			assignments.push(`${column} = ?`);
			values.push(value);
		}
	}

	if (assignments.length === 0) {
		return findByIdAndUser(categoryId, userId);
	}

	values.push(categoryId, userId);
	await pool.query(
		`UPDATE categories SET ${assignments.join(', ')}
		WHERE id = ? AND user_id = ? AND is_active = 1 AND deleted_at IS NULL`,
		values,
	);

	return findByIdAndUser(categoryId, userId);
}

async function deactivate(categoryId, userId) {
	const [result] = await pool.query(
		`UPDATE categories
		SET is_active = 0, deleted_at = NOW()
		WHERE id = ? AND user_id = ? AND is_active = 1 AND deleted_at IS NULL`,
		[categoryId, userId],
	);

	return result.affectedRows;
}

async function ensureDefaultCategories(userId, module) {
	const [rows] = await pool.query(
		`SELECT COUNT(*) AS defaultCount
		FROM categories
		WHERE user_id = ? AND module = ? AND is_default = 1`,
		[userId, module],
	);

	if (Number(rows[0].defaultCount) > 0) {
		return;
	}

	const moduleDefaults = defaultCategories[module];
	const values = moduleDefaults.flatMap(({ name, description = null, icon, color }) => [
		userId,
		module,
		name,
		description,
		name.toLowerCase(),
		icon,
		color,
	]);
	const placeholders = moduleDefaults.map(() => '(?, ?, ?, ?, ?, ?, ?, 1, 1)');

	await pool.query(
		`INSERT INTO categories
			(user_id, module, name, description, normalized_name, icon, color, is_default, is_active)
		VALUES ${placeholders.join(', ')}
		ON DUPLICATE KEY UPDATE id = id`,
		values,
	);
}

function mapCategory(row) {
	return {
		...row,
		isDefault: Boolean(row.isDefault),
		isActive: Boolean(row.isActive),
		isRecurring: Boolean(row.isRecurring),
	};
}

module.exports = {
	create,
	findAllByUserAndModule,
	findByIdAndUser,
	findByNormalizedName,
	update,
	deactivate,
};
