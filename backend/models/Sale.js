const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  customer: {
    name: { type: String, required: true },
    contact: { type: String }
  },
  items: [{
    type: { type: String, required: true }, // product type or livestock type
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    unit: { type: String }
  }],
  totalAmount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  }
});

module.exports = mongoose.model('Sale', saleSchema); 