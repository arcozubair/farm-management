const express = require('express');
const router = express.Router();
const {
  createSale,
  getSales,
  getSalesByDateRange
} = require('../controllers/saleController');
const { protect } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getSales)
  .post(createSale);

router.get('/report', getSalesByDateRange);

module.exports = router; 