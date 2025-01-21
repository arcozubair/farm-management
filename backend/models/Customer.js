const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  whatsappNotification: {
    type: Boolean,
    default: false
  },
  openingBalance: {
    type: Number,
    required: true,
    default: 0
  },
  transactions: [{
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomerTransaction'
    },
    date: {
      type: Date,
      required: true
    }
  }],
  invoices: [{
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  currentBalance: {
    type: Number,
    required: true,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { 
  timestamps: true 
});

// Add indexes for better query performance
customerSchema.index({ name: 1 });
customerSchema.index({ contactNumber: 1 });

module.exports = mongoose.model('Customer', customerSchema); 