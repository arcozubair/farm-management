// authMiddleware.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to protect routes and authorize permissions
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Middleware to authorize based on user permissions
exports.authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      
      // Check if user is admin
      if (user.role === 'admin') {
        return next();
      }

      // Check if user has any of the required permissions
      const hasPermission = roles.some(permission => 
        user.permissions && user.permissions[permission]
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'User not authorized for this action'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  };
};
// Check permission middleware
exports.checkPermission = (permissionName) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return res.status(403).json({
        success: false,
        error: 'No permissions found'
      });
    }

    // Get permission value from Map
    const hasPermission = req.user.permissions.get(permissionName);
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};
