const express = require('express');
const router = express.Router();
const dayBookController = require('../controllers/dayBookController');
const { protect } = require('../middleware/auth');

// All routes are protected with authentication
router.use(protect);

// Get entries for a specific date
router.get('/', dayBookController.getDayBook);

// Add new collection entry (milk/eggs)
router.post('/collection', dayBookController.addCollection);

// Add new transaction entry (customer payments)
router.post('/transaction', dayBookController.addTransaction);

module.exports = router; 