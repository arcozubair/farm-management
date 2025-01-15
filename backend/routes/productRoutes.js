const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  getAllProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  updateStock,
  getProductDetails,
  updatePrice
} = require('../controllers/productController');

// Route order matters! Put specific routes before parameterized routes
router.post('/update-price', protect, updatePrice);
router.post('/updateStock', protect, updateStock);
router.get('/details', protect, getProductDetails);

router.route('/')
  .get(protect, getAllProducts)
  .post(protect, createProduct);

router.route('/:id')
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

module.exports = router; 