const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createSale, getSales, getSalesById, updateSalesPayment, getSalesByCustomer, getSalesByDate, deleteSale, updateSale, createMultipleSales } = require('../controllers/saleController');

// All routes are protected
router.use(protect);

// Routes
router.route('/')
    .post(createSale)
    
router.route('/create-multiple')
    .post(createMultipleSales)

router.route('/:id')
    .get(getSalesById)
    .put(updateSalesPayment)
    .post(updateSale)
    .delete(authorize('admin'), deleteSale);

router.get('/customer/:customerId', getSalesByCustomer);

router.get('/by-date/:date', getSales);


module.exports = router; 