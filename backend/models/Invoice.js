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
            enum: ['Product', 'Livestock']
        },
        name: String,
        quantity: Number,
        price: Number,
        total: Number,
        weight: Number,
        unit: String
    }],
    grandTotal: {
        type: Number,
        required: true
    },
    remainingBalance: {
        type: Number,
        required: true
<<<<<<< HEAD
    },
    pdfPath: {
        type: String,
        required: false
    },
    whatsappSent: {
        type: Boolean,
        default: false
    },
    whatsappError: {
        type: String
=======
>>>>>>> bd717611ca45c98ffa02d45267fe3933ea3f7ddd
    }
}, {
    timestamps: true
});

// Add index for invoice number
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });

module.exports = mongoose.model('Invoice', invoiceSchema); 