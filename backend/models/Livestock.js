const mongoose = require('mongoose');

const livestockSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['sheep', 'cow', 'chicken'], 
    required: true 
  },
  gender: { 
    type: String, 
    enum: ['male', 'female'], 
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
  }
});

module.exports = mongoose.model('Livestock', livestockSchema); 