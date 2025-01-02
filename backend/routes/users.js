const express = require('express');
const router = express.Router();
const { getAllUsers, createEmployee, updateUser, deleteUser, assignPermissions, revokePermissions, updatePassword } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.put('/password', updatePassword);

// Routes with permissions
router.get('/', authorize('canView'), getAllUsers);
router.post('/', authorize('canCreate'), createEmployee);

router.route('/:id') 
  .put(authorize('canEdit'), updateUser)
  .delete(authorize('admin'), deleteUser);

router.patch('/:id/permissions', authorize('canAssignPermissions'), assignPermissions);
router.patch('/:id/permissions/revoke', authorize('canRevokePermissions'), revokePermissions);

module.exports = router;
