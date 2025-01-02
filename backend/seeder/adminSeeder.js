const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const config = require('../config/config'); // Ensure this has the correct MONGO_URI

const createInitialAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');

    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });


    if (!adminExists) {
      // Create default admin credentials with full permissions
      const adminData = {
        username: 'admin',
        password: 'admin123', // You should change this immediately after first login
        name: 'System Admin',
        email: 'admin@farm.com',
        role: 'admin',
        permissions: {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canAssignPermissions: true,
          canRevokePermissions: true
        }
      };

      
      // Create admin user
      const newUser = await User.create(adminData);
      console.log('Admin user created successfully');
      console.log('Username: admin');
      console.log('Password: admin123');
      console.log('Please change these credentials after first login!');
    } else {
      console.log('Admin user already exists');
    }

    process.exit();
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createInitialAdmin();
