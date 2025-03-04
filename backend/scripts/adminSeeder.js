const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const config = require('../config/config');
const connectDB = require('../database/db.config');

const createInitialAdmin = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB...');

    // Check if admin already exists
    const adminExists = await User.findOne({ role: 'admin' });

    if (!adminExists) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      // Create default admin credentials with full permissions
      const adminData = {
        username: 'admin',
        password: "admin123",
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

  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit();
  }
};

// Run the seeder
createInitialAdmin();
