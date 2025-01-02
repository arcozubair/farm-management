const express = require('express');
const router = express.Router();
const {
  getAllLivestock,
  addLivestock,
  updateLivestock,
  getLivestockStats
} = require('../controllers/livestockController');
const { protect } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getAllLivestock)
  .post(addLivestock);

router
  .route('/:id')
  .put(updateLivestock);

router.get('/stats', getLivestockStats);

module.exports = router; 