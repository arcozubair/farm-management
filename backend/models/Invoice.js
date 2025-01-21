const mongoose = require('mongoose');

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
    items: [{
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'items.itemType'
        },
        itemType: {
            type: String,
            required: true,
            enum: ['PRODUCT', 'LIVESTOCK']
        },
        name: String,
        quantity: Number,
        price: Number,
        total: Number,
        unit: String
    }],
    grandTotal: {
        type: Number,
        required: true
    },
    remainingBalance: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

// Add index for invoice number
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });

module.exports = mongoose.model('Invoice', invoiceSchema); 