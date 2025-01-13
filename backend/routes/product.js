const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  getAllProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  updateStock
} = require('../controllers/productController');

// Existing routes
router.get('/', protect, getAllProducts);
router.post('/', protect, createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

// Add the new updateStock route
router.post('/updateStock', protect, updateStock);

module.exports = router; 