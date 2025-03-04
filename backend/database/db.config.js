const mongoose = require('mongoose');
const config = require('../config/config');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI + '?replicaSet=rs0');
    console.log('MongoDB Connected...');
    // Initialize products after DB connection
  } catch (err) {
    console.log('MongoDB Connection Error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;