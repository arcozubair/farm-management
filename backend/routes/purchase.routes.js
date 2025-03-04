const express = require("express");
const router = express.Router();
const {
  createPurchase,
  getPurchase,
  getPurchases,
  generatePurchaseNumber
} = require("../controllers/purchaseController");
const { protect } = require("../middleware/auth");

// Apply authentication middleware to all routes
router.use(protect);

// Purchase routes
router.post('/', createPurchase);
router.get('/:id', getPurchase);
router.get('/date/:date', getPurchases);

module.exports = router; 