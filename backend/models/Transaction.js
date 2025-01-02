const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer',
    required: true 
  },
  invoice: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Invoice'
  },
  type: {
    type: String,
    enum: ['payment', 'purchase', 'refund'],
    required: true
  },
  amount: { 
    type: Number, 
    required: true 
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank', 'credit'],
    required: true
  },
  notes: { 
    type: String 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  balanceAfterTransaction: { 
    type: Number, 
    required: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  }
});

module.exports = mongoose.model('Transaction', transactionSchema); 