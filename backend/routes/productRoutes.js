const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const productController = require('../controllers/productController');

// Existing routes
router.get('/', protect, productController.getAllProducts);
router.post('/', protect, productController.createProduct);
router.put('/:id', protect, productController.updateProduct);
router.delete('/:id', protect, productController.deleteProduct);

// Add the new updateStock route
router.post('/updateStock', protect, productController.updateStock);

// Add this new route
router.get('/details', protect, productController.getProductDetails);

module.exports = router; 