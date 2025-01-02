const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ['livestock', 'product'],
    required: true
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // Using refPath to dynamically reference either Livestock or Product
    refPath: 'items.itemModel'
  },
  itemModel: {
    type: String,
    required: true,
    enum: ['Livestock', 'Product']
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true
  }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [invoiceItemSchema],
  subTotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['paid', 'partial', 'unpaid'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank', 'credit'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: String
});

// Pre-save middleware to calculate totals
invoiceSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subTotal = this.items.reduce((sum, item) => sum + item.total, 0);
  
  // Calculate final total
  this.totalAmount = this.subTotal + this.tax - this.discount;
  
  // Calculate balance
  this.balance = this.totalAmount - this.paidAmount;
  
  // Update status based on payment
  if (this.balance === 0) {
    this.status = 'paid';
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  } else {
    this.status = 'unpaid';
  }
  
  next();
});

// Method to update inventory after invoice creation
invoiceSchema.methods.updateInventory = async function() {
  for (const item of this.items) {
    const Model = mongoose.model(item.itemModel);
    await Model.findByIdAndUpdate(item.item, {
      $inc: { quantity: -item.quantity }
    });
  }
};

// Static method to generate invoice number
invoiceSchema.statics.generateInvoiceNumber = async function() {
  const count = await this.countDocuments();
  const date = new Date();
  return `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(count + 1).padStart(4, '0')}`;
};

module.exports = mongoose.model('Invoice', invoiceSchema); 