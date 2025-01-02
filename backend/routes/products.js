const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  updateProduct,
  addProductStock
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getAllProducts);

router
  .route('/:id')
  .put(updateProduct);

router.post('/stock', addProductStock);

module.exports = router; 