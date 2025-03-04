const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  getProductMovements,
  getLivestockMovements,
  getMovementsByDate,
  searchMovements 
} = require('../controllers/stockMovementController');

// These routes should be mounted at /api
router.get('/products/:productId/movements', protect, getProductMovements);
router.get('/livestock/:livestockId/movements', protect, getLivestockMovements);

// Additional routes
router.get('/by-date/:date', protect, getMovementsByDate);
router.get('/search', protect, searchMovements);

module.exports = router; 