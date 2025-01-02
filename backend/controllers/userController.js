const User = require('../models/User');  // Assuming you're using Mongoose for MongoDB

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// Create a new user (admin only)
exports.createEmployee = async (req, res) => {
  try {
    const { username, password, name, email, role, permissions } = req.body;
    
    console.log('Creating user with permissions:', permissions); // Debug log

    const userPermissions = permissions || {};

    const newUser = new User({
      username,
      password,
      name,
      email,
      role,
      permissions: userPermissions,
    });

    await newUser.save();
    console.log('Saved user with permissions:', newUser.permissions); // Debug log

    res.status(201).json({
      success: true,
      data: newUser,
    });
  } catch (error) {
    console.error('Error creating user:', error); // Debug log
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};


// Update user details (admin only)
exports.updateUser = async (req, res) => {
  try {
    const { userId, permissions } = req.body; // permissions should be an object

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Update permissions
    if (permissions) {
      user.permissions = { ...user.permissions, ...permissions };  // Merge new permissions
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error); // Debug log
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};


// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    // Find user by id
    const user = await User.findById(req.params.id);

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deletion of admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin users cannot be deleted'
      });
    }

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error); // Add logging for debugging
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message // Include error message for debugging
    });
  }
};

exports.assignPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    console.log('Received permissions update:', {
      userId: req.params.id,
      permissions: permissions
    }); // Debug log

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user permissions
    user.permissions = permissions;
    
    // Save the updated user
    await user.save();
    
    console.log('Updated user permissions:', user.permissions); // Debug log

    res.status(200).json({
      success: true,
      data: user,
      message: 'Permissions updated successfully'
    });
  } catch (error) {
    console.error('Error updating permissions:', error); // Debug log
    res.status(500).json({
      success: false,
      error: 'Error updating permissions'
    });
  }
};


// Revoke permissions from a specific user (admin only)
exports.revokePermissions = async (req, res) => {
  const { permissions } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.permissions = user.permissions.filter(permission => !permissions.includes(permission));
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Permissions revoked successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    console.log(req.user.id,"and password data is" ,req.body)
    
    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if current password matches
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save({modifiedFieldsOnly: true});

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      modifiedAt: user.passwordModifiedAt,
      modifiedFields: ['password']
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  }
};
