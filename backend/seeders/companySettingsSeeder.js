const mongoose = require('mongoose');
const CompanySettings = require('../models/CompanySettings');
require('dotenv').config();

const companyData = {
  companyName: "Dairy Farm Management",
  address: {
    line1: "123 Dairy Road",
    line2: "Farm District",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560001"
  },
  contactNumbers: [
    "+91 9876543210",
    "+91 9876543211"
  ],
  email: "contact@dairyfarm.com",
  gstNumber: "29ABCDE1234F1Z5",
  numberSequences: {
    lastTransactionNumber: 0,
    lastInvoiceNumber: 0,
    lastReceiptNumber: 0
  },
  prefixes: {
    transactionPrefix: "TXN",
    invoicePrefix: "INV",
    receiptPrefix: "RCP"
  }
};

const seedCompanySettings = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/farm_management';
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Connecting to MongoDB...');
    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully!');

    // Check if company settings already exist
    const existingSettings = await CompanySettings.findOne();
    
    if (existingSettings) {
      console.log('Company settings already exist. Updating...');
      await CompanySettings.findByIdAndUpdate(existingSettings._id, companyData);
      console.log('Company settings updated successfully!');
    } else {
      console.log('Creating new company settings...');
      await CompanySettings.create(companyData);
      console.log('Company settings created successfully!');
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error:', error.message);
    if (!process.env.MONGODB_URI) {
      console.error('\nPlease make sure:');
      console.error('1. You have a .env file in your project root');
      console.error('2. The .env file contains MONGODB_URI');
      console.error('Example .env content:');
      console.error('MONGODB_URI=mongodb://localhost:27017/farm-software\n');
    }
    process.exit(1);
  }
};

// Run the seeder
seedCompanySettings(); 