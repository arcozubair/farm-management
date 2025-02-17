const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
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
            refPath: 'items.itemType'
        },
        itemType: {
            type: String,
            enum: ['Product', 'Livestock'],
            required: true
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
    paidAmount: {
        type: Number,
        default: 0
    },
    remainingBalance: {
        type: Number,
        required: true
    },
    pdfPath: {
        type: String
    },
    whatsappSent: {
        type: Boolean,
        default: false
    },
    whatsappError: {
        type: String
    },
    whatsappSentAt: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
saleSchema.index({ invoiceNumber: 1 });
saleSchema.index({ customer: 1 });
saleSchema.index({ createdAt: 1 });

module.exports = mongoose.models.Sales || mongoose.model('Sales', saleSchema);
