const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  contactNumber: { 
    type: String, 
    required: true 
  },
  address: { 
    type: String 
  },
  email: { 
    type: String 
  },
  currentBalance: { 
    type: Number, 
    default: 0 
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  invoices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  }],
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }],
  totalPurchases: {
    type: Number,
    default: 0
  },
  lastPurchaseDate: {
    type: Date
  },
  dateCreated: { 
    type: Date, 
    default: Date.now 
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Method to add invoice to customer
customerSchema.methods.addInvoice = async function(invoiceId) {
  this.invoices.push(invoiceId);
  await this.save();
};

// Method to add transaction to customer
customerSchema.methods.addTransaction = async function(transactionId) {
  this.transactions.push(transactionId);
  await this.save();
};

// Method to update balance
customerSchema.methods.updateBalance = async function(amount) {
  this.currentBalance += amount;
  await this.save();
};

// Method to update purchase statistics
customerSchema.methods.updatePurchaseStats = async function(amount) {
  this.totalPurchases += amount;
  this.lastPurchaseDate = new Date();
  await this.save();
};

// Static method to get customer with full history
customerSchema.statics.getCustomerWithHistory = async function(customerId) {
  return await this.findById(customerId)
    .populate({
      path: 'invoices',
      options: { sort: { date: -1 } }
    })
    .populate({
      path: 'transactions',
      options: { sort: { date: -1 } }
    });
};

module.exports = mongoose.model('Customer', customerSchema); 