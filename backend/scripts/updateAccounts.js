const mongoose = require('mongoose');
const Account = require('../models/Account.model');
require('dotenv').config();

async function updateAccounts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Update all accounts to add new fields
    const accounts = await Account.find({});
    console.log(`Found ${accounts.length} accounts to update`);
    
    for (const account of accounts) {
      // Set initialBalance equal to current balance
      account.initialBalance = account.balance || 0;
      
      // Set balance method based on account type
      if (['Sale', 'Purchase', 'Expense', 'Liability'].includes(account.accountType)) {
        account.balanceMethod = 'transactional';
      } else {
        account.balanceMethod = 'perpetual';
      }
      
      await account.save();
    }
    
    console.log('Account updates completed');
    process.exit(0);
  } catch (error) {
    console.error('Error updating accounts:', error);
    process.exit(1);
  }
}

updateAccounts(); 