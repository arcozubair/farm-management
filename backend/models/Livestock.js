const mongoose = require('mongoose');

const livestockSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['cattle', 'sheep', 'poultry']
  },
  type: {
    type: String,
    required: true
  },
  rate: {
    type: Number,
    required: true,
    default: 0
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  notes: String
}, { timestamps: true });

// Predefined types for each category
livestockSchema.statics.getTypes = function() {
  return {
    cattle: ['cow', 'bull', 'maleCalf', 'femaleCalf'],
    poultry: ['hen', 'rooster', 'chick'],
    sheep: ['femaleSheep', 'maleSheep', 'maleLamb', 'femaleLamb']
  };
};

module.exports = mongoose.model('Livestock', livestockSchema); 