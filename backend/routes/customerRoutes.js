const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createCustomer,
  getCustomers,
  updateCustomer,
  getCustomerLedger,
  searchCustomers,
  getCustomerLedgerSummary
} = require('../controllers/customerController');

router.use(protect);

router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.route('/:id')
  .put(updateCustomer);

router.route('/:id/ledger')
  .get(getCustomerLedger);

router.get('/search', protect, searchCustomers);

router.get('/:customerId/ledger', protect, getCustomerLedger);

router.get('/:id/ledger/summary', protect, getCustomerLedgerSummary);

module.exports = router; 