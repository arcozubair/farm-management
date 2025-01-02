const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['eggs', 'milk'], 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 0 
  },
  unit: { 
    type: String, 
    required: true 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Product', productSchema); 