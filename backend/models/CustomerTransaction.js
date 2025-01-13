const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionNumber: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true
  },
  modeOfPayment: {
    type: String,
    enum: ['cash', 'account_transfer'],
    required: true
  },
  paymentDetails: {
    type: String
  },
  notifiedOnWhatsapp: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  }
}, { timestamps: true });

const customerTransactionSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  currentBalance: {
    type: Number,
    required: true,
    default: 0
  },
  transactions: [transactionSchema]
}, { 
  timestamps: true 
});

// Add index for better query performance
customerTransactionSchema.index({ customerId: 1 });
customerTransactionSchema.index({ 'transactions.date': -1 });
customerTransactionSchema.index({ 'transactions.transactionNumber': 1 });

module.exports = mongoose.model('CustomerTransaction', customerTransactionSchema); 