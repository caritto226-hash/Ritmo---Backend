const express = require('express');
const {
	validateCategoryModule,
	validateCreateCategory,
	validateUpdateCategory,
} = require('./categories.validator');
const categoriesController = require('./categories.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get('/', verifyToken, validateCategoryModule, categoriesController.getCategories);
router.post('/', verifyToken, validateCreateCategory, categoriesController.createCategory);
router.get('/:id', verifyToken, categoriesController.getCategoryById);
router.patch('/:id', verifyToken, validateUpdateCategory, categoriesController.updateCategory);
router.delete('/:id', verifyToken, categoriesController.deleteCategory);

module.exports = router;
