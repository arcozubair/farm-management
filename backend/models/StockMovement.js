const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  transactionType: {
    type: String,
    required: true,
    enum: ['Initial', 'Purchase', 'Sale', 'Adjustment', 'Collection']
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
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
  unitRate: {
    type: Number,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reference: {
    type: {
      type: String,
      enum: ['Sale', 'Purchase', 'Adjustment', 'Collection'],
      required: function() {
        return this.transactionType !== 'Initial';
      }
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: function() {
        return this.transactionType !== 'Initial';
      }
    }
  },
  notes: {
    type: String
  }
}, {
  timestamps: true,
  indexes: [
    { product: 1, date: 1 },
    { transactionType: 1 },
    { 'reference.type': 1, 'reference.id': 1 }
  ]
});

module.exports = mongoose.model('StockMovement', stockMovementSchema); 