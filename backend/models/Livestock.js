const mongoose = require('mongoose');

const livestockSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['cattle', 'poultry', 'sheep'] // Main categories
  },
  type: {
    type: String,
    required: true
  },

  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Predefined types for each category
livestockSchema.statics.getTypes = function() {
  return {
    cattle: ['cow', 'bull', 'calf'],
    poultry: ['hen', 'rooster', 'chick'],
    sheep: ['ewe', 'ram', 'lamb']
  };
};

module.exports = mongoose.model('Livestock', livestockSchema); 