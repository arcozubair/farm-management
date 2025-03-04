const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
 
  unit: {
    type: String,
    required: true,
    enum: ['litre', 'kg', 'gram', 'dozen', 'piece', 'packet']
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
productSchema.index({ name: 1 }, { unique: true });
productSchema.index({ category: 1 });

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.currentStock <= this.minStockLevel) {
    return 'low';
  } else if (this.currentStock <= this.reorderPoint) {
    return 'reorder';
  } else if (this.maxStockLevel && this.currentStock >= this.maxStockLevel) {
    return 'excess';
  }
  return 'normal';
});

// Method to check if stock is sufficient
productSchema.methods.hasEnoughStock = function(quantity) {
  return this.currentStock >= quantity;
};

module.exports = mongoose.model('Product', productSchema); 