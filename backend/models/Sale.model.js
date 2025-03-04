const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    saleNumber: {
        type: String,
        required: true,
        unique: true
    },
   
    date: {
        type: Date,
        default: Date.now
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    items: [{
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        rate: {
            type: Number,
            required: true,
            default: 0
        },
        amount: {
            type: Number,
            required: true,
            default: 0
        }
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
    },
    transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }]
}, {
    timestamps: true
});

// Add indexes for better query performance
saleSchema.index({ saleNumber: 1 });
saleSchema.index({ customer: 1 });
saleSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Sale', saleSchema);
