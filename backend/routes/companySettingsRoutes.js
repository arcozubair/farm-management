const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getSettings,
    updateSettings,
    getNextInvoiceNumber
} = require('../controllers/companySettingsController');

router.use(protect);

router.route('/')
    .get(getSettings)
    .put(updateSettings);

router.get('/next-invoice-number', getNextInvoiceNumber);

module.exports = router;