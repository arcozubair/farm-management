const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const purchaseSchema = new Schema({
    purchaseNumber: {
        type: String,
        required: true,
        unique: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    supplier: {
        type: Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    items: [{
        itemType: {
            type: String,
            enum: ['Product', 'Livestock'],
            required: true
        },
        itemId: {
            type: Schema.Types.ObjectId,
            refPath: 'items.itemType',
            required: true
        },
        name: String,
        quantity: {
            type: Number,
            required: true,
            min: 0
        },
        unit: String,
        price: {
            type: Number,
            required: true,
            min: 0
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    grandTotal: {
        type: Number,
        required: true,
        min: 0
    },
    paidAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    remainingBalance: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'completed'
    },
    notes: String,
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Add indexes for better query performance
purchaseSchema.index({ purchaseNumber: 1 });
purchaseSchema.index({ supplier: 1 });
purchaseSchema.index({ date: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);

