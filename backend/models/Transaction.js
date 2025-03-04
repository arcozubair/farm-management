const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
description: {
  type: String,
},
contextDescriptions: {
  type: Map,
  of: String
},
amount: {
  type: Number,
  required: true
},
debitAccount: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Account',
  required: true
},
creditAccount: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Account',
  required: true
},  
saleRef: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Sale',
  optional: true
},
purchaseRef: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Purchase',
  optional: true
},
expenseRef: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Expense',
  optional: true
},  
collectionRef: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Collection',
  optional: true
},    
deathRef: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Death',
  optional: true
}, 
 date: {
  type: Date,
  required: true
},
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  }
},{timestamps: true});

module.exports = mongoose.model('Transaction', transactionSchema); 