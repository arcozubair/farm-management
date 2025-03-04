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
  updatePrice,
  getProductMovements,
  getDailyStockReport
  
} = require('../controllers/productController');

// Route order matters! Put specific routes before parameterized routes
router.post('/update-price', protect, updatePrice);
router.post('/update-stock', protect, updateStock);
router.get('/details', protect, getProductDetails);
router.get('/:productId/movements', protect, getProductMovements);
router.get('/daily-report', protect, getDailyStockReport);



router.route('/')
  .get(protect, getAllProducts)
  .post(protect, createProduct);

router.route('/:id')
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

module.exports = router; 