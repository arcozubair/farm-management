const mongoose = require('mongoose');

const livestockMovementSchema = new mongoose.Schema({
  livestock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Livestock',
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  transactionType: {
    type: String,
    enum: ['Initial', 'Purchase', 'Sale', 'Death', 'Birth'],
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
  reference: {
    type: {
      type: String,
      enum: ['Sale', 'Purchase']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'reference.type'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { 
  timestamps: true,
  indexes: [
    { livestock: 1, date: -1 }, // For querying movements by livestock
    { date: -1 } // For general queries
  ]
});

module.exports = mongoose.model('LivestockMovement', livestockMovementSchema); 