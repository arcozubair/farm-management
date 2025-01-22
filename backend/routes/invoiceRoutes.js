const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createInvoice,
    getInvoices,
    getInvoiceById,
    updateInvoicePayment,
    deleteInvoice,
    getInvoicesByCustomer,
    getInvoicesByDate
} = require('../controllers/invoiceController');

// All routes are protected
router.use(protect);

// Routes
router.route('/')
    .post(createInvoice)
    .get(getInvoices);

router.route('/:id')
    .get(getInvoiceById)
    .put(updateInvoicePayment)
    .delete(authorize('admin'), deleteInvoice);

router.get('/customer/:customerId', getInvoicesByCustomer);

router.get('/by-date/:date', getInvoicesByDate);

module.exports = router; 