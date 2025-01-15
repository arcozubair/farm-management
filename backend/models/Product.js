const mongoose = require('mongoose');

const stockHistorySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  transactionType: {
    type: String,
    enum: ['collection', 'sale'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousStock: {
    type: Number,
    required: true
  },
  currentStock: {
    type: Number,
    required: true
  },
  shift: {
    type: String,
    enum: ['morning', 'evening'],
    required: function() {
      return this.transactionType === 'collection';
    }
  },
  dayBookEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DayBook',
    required: true
  }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['milk', 'eggs']
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  stockHistory: [stockHistorySchema]
}, { timestamps: true });

// Add index for better query performance
productSchema.index({ type: 1 });

module.exports = mongoose.model('Product', productSchema); 