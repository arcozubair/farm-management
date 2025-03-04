const mongoose = require('mongoose');
const seedDefaultAccounts = require('./defaultAccounts');
const connectDB = require('../database/db.config');

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    console.log('Connected to MongoDB');
    
    await seedDefaultAccounts();
    
    console.log('Seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase(); 