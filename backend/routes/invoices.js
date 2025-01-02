const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get((req, res) => {
    // Get all invoices
  })
  .post((req, res) => {
    // Create new invoice
  });

router
  .route('/:id')
  .get((req, res) => {
    // Get single invoice
  })
  .put((req, res) => {
    // Update invoice
  });

module.exports = router; 