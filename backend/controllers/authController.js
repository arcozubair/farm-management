const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide username and password'
      });
    }

    console.log('Login attempt for username:', username); // Debug log

    // Check for user
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      console.log('User not found:', username); // Debug log
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', username); // Debug log
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Remove password from response
    const userResponse = {
      _id: user._id,
      username: user.username,
      name: user.name,
      createdAt: user.createdAt,
      email: user.email,
      role: user.role,
      permissions: {
        canView: user.permissions.get('canView') || false,
        canCreate: user.permissions.get('canCreate') || false,
        canEdit: user.permissions.get('canEdit') || false,
        canDelete: user.permissions.get('canDelete') || false,
        canAssignPermissions: user.permissions.get('canAssignPermissions') || false,
        canRevokePermissions: user.permissions.get('canRevokePermissions') || false
      }
    };

    console.log('Login successful for user:', username); // Debug log

    res.status(200).json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error); // Debug log
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Admin
exports.register = async (req, res) => {
  try {
    const { username, password, name, email, role } = req.body;

    // Create user
    const user = await User.create({
      username,
      password, // Password will be hashed via pre-save middleware
      name,
      email,
      role
    });

    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Remove password from response
    const userResponse = {
      _id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.status(201).json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Username or email already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        permissions: {
          canView: user.permissions.get('canView') || false,
          canCreate: user.permissions.get('canCreate') || false,
          canEdit: user.permissions.get('canEdit') || false,
          canDelete: user.permissions.get('canDelete') || false,
          canAssignPermissions: user.permissions.get('canAssignPermissions') || false,
          canRevokePermissions: user.permissions.get('canRevokePermissions') || false
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Update user details
exports.updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      username: req.body.username
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
       
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid user data'
    });
  }
}; 