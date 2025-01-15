const express = require('express');
const router = express.Router();
const {
  getAllLivestock,
  addLivestock,
  updateLivestock,
  deleteLivestock,
  getLivestockStats,
  updatePrice
} = require('../controllers/livestockController');
const { protect, checkPermission } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(getAllLivestock)
  .post(addLivestock);

router
  .route('/:id')
  .put(updateLivestock)
  .delete(checkPermission('canDelete'), deleteLivestock);

router.get('/stats', getLivestockStats);

router.post('/update-price', protect, updatePrice);

module.exports = router; 