const express = require('express');
const router = express.Router();
const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  createInvoice,
  getCustomerLedger,
  getCustomerStats
} = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

// Customer routes
router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

// Invoice and ledger routes
router.post('/:id/invoices', createInvoice);
router.get('/:id/ledger', getCustomerLedger);
router.get('/:id/stats', getCustomerStats);

module.exports = router; 