const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({

    expenseId: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    }   ,
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    paidTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        optional: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('Expense', expenseSchema);
