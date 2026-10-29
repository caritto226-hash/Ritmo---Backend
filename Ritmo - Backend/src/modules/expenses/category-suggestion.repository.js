const { pool } = require('../../config/mysql');

// Solo lectura: a diferencia de categoriesRepository.findAllByUserAndModule, no crea las
// categorías predeterminadas que falten. Pedir una sugerencia nunca escribe en la base.
async function findActiveFinanceCategories(userId) {
	const [rows] = await pool.query(
		`SELECT id, name
		FROM categories
		WHERE user_id = ? AND module = 'finance' AND is_active = 1 AND deleted_at IS NULL`,
		[userId],
	);

	return rows;
}

module.exports = {
	findActiveFinanceCategories,
};
