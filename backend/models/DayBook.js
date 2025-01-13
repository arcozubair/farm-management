const mongoose = require('mongoose');

const collectionEntrySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['milk', 'eggs'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  shift: {
    type: String,
    enum: ['morning', 'evening'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const transactionEntrySchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  amountPaid: {
    type: Number,
    required: true
  },
  previousBalance: {
    type: Number,
    required: true
  },
  currentBalance: {
    type: Number,
    required: true
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'account_transfer'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const dayBookSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  collections: [collectionEntrySchema],
  transactions: [transactionEntrySchema],
  summary: {
    totalMilk: { type: Number, default: 0 },
    totalEggs: { type: Number, default: 0 },
    totalPayments: { type: Number, default: 0 }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

dayBookSchema.pre('save', function(next) {
  this.summary.totalMilk = this.collections
    .filter(c => c.type === 'milk')
    .reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);

  this.summary.totalEggs = this.collections
    .filter(c => c.type === 'eggs')
    .reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);

  next();
});

module.exports = mongoose.model('DayBook', dayBookSchema);