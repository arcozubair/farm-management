const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String
  },
  contactNumbers: [{
    type: String,
    trim: true
  }],
  email: {
    type: String,
    trim: true
  },
  gstNumber: {
    type: String,
    trim: true
  },
  numberSequences: {
    lastTransactionNumber: {
      type: Number,
      default: 0
    },
    lastTransferNumber:{
      type: Number,
      default: 0

    },
    lastSaleNumber: {
      type: Number,
      default: 0
    },
    lastReceiptNumber: {
      type: Number,
      default: 0
    },
    lastTransferNumber: {
      type: Number,
      default: 0
    },
    lastPurchaseNumber: {
      type: Number,
      default: 0
    }
  },
  prefixes: {
    transactionPrefix: {
      type: String,
      default: 'TXN'
    },
    transferPrefix:{
      type: String,
      default:'TRF'
    },
    salePrefix: {
      type: String,
      default: 'SALE'
    },
    receiptPrefix: {
      type: String,
      default: 'RCP'
    },
    transferPrefix: {
      type: String,
      default: 'TRF'
    },
    purchasePrefix: {
      type: String,
      default: 'PUR'
    }
  }
}, { 
  timestamps: true 
});

const CompanySettings = mongoose.model('CompanySettings', companySettingsSchema);

// Create a separate function for generating numbers
CompanySettings.generateNextNumber = async function(type) {
  const settings = await this.findOne();
  if (!settings) {
    throw new Error('Company settings not found');
  }

  const sequenceKey = `numberSequences.last${type.charAt(0).toUpperCase() + type.slice(1)}Number`;
  const prefixKey = `prefixes.${type}Prefix`;
  
  // Increment the sequence
  const updatedSettings = await this.findOneAndUpdate(
    {},
    { $inc: { [sequenceKey]: 1 } },
    { new: true }
  );

  if (!updatedSettings) {
    throw new Error('Failed to update sequence number');
  }

  const currentNumber = updatedSettings.numberSequences[`last${type.charAt(0).toUpperCase() + type.slice(1)}Number`];
  const prefix = updatedSettings.prefixes[`${type}Prefix`];
  
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');

  // Format: PREFIX-YY/MM-SEQUENCE
  return `${prefix}-${year}/${month}-${currentNumber.toString().padStart(5, '0')}`;
};

module.exports = CompanySettings; 