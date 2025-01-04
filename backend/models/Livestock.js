const mongoose = require('mongoose');

const livestockSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['cattle', 'poultry', 'sheep']
  },
  type: {
    type: String,
    required: true,
    enum: [
      // Cattle
      'cow', 'bull', 'maleCalf', 'femaleCalf',
      // Poultry
      'hen', 'rooster', 'chick',
      // Sheep
      'femaleSheep', 'maleSheep', 'maleLamb', 'femaleLamb'
    ]
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  notes: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Predefined types for each category
livestockSchema.statics.getTypes = function() {
  return {
    cattle: ['cow', 'bull', 'maleCalf', 'femaleCalf'],
    poultry: ['hen', 'rooster', 'chick'],
    sheep: ['femaleSheep', 'maleSheep', 'maleLamb', 'femaleLamb']
  };
};

module.exports = mongoose.model('Livestock', livestockSchema); 