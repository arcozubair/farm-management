const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  accountType: {
    type: String,
    enum: ["Sale", "Purchase", "Bank", "Cash", "Expense", "Customer", "Supplier", "Liability"],
    default: "Sale",
  },
  accountName: String,
  customerName: {
    type: String,
    required: function() {
      return this.accountType === "Customer";
    }
  },
  supplierName: {
    type: String,
    required: function() {
      return this.accountType === "Supplier";
    }
  },
  email: {
    type: String,
    required: function() {
      return this.accountType === "Customer" || this.accountType === "Supplier";
    }
  },
  contactNo: {
    type: String,
    required: function() {
      return this.accountType === "Customer" || this.accountType === "Supplier";
    }
  },
  address: {
    type: String,
    required: function() {
      return this.accountType === "Customer" || this.accountType === "Supplier";
    }
  },
  initialBalance: {
    type: Number,
    default: 0  // The balance when account was first created
  },
  balance: {
    type: Number,
    default: 0   // Current running balance in the system
  },
  balanceMethod: {
    type: String,
    enum: ['transactional', 'perpetual'],
    default: function() {
      // Nominal accounts use transactional (always start at 0 for reporting periods)
      if (['Sale', 'Purchase', 'Expense', 'Liability'].includes(this.accountType)) {
        return 'transactional';
      }
      // Real accounts keep a perpetual balance
      return 'perpetual';
    }
  },
  note: String,
}, {timestamps: true});

// Method to calculate opening balance for a specific date
accountSchema.methods.calculateOpeningBalance = async function(date) {
  const Transaction = mongoose.model('Transaction');
  
  // For transactional accounts (Sales, etc.), always start at 0
  // and only include transactions before the start date
  if (this.balanceMethod === 'transactional') {
    // Get transactions before the start date
    const transactionBalance = await Transaction.aggregate([
      {
        $match: {
          $or: [
            { debitAccount: this._id },
            { creditAccount: this._id }
          ],
          date: { $lt: date }
        }
      },
      {
        $group: {
          _id: null,
          balance: {
            $sum: {
              $cond: [
                { $eq: ["$debitAccount", this._id] },
                "$amount",  // If debit, add amount
                { $multiply: ["$amount", -1] }  // If credit, subtract amount
              ]
            }
          }
        }
      }
    ]);
    
    return transactionBalance[0]?.balance || 0;
  }
  
  // For perpetual accounts (Cash, Bank, Customer, Supplier)
  // we need to find the balance as of the start date
  
  // First, get current balance from account
  let startingBalance = this.initialBalance;
  
  // Add all transactions that happened before the start date
  const transactionBalance = await Transaction.aggregate([
    {
      $match: {
        $or: [
          { debitAccount: this._id },
          { creditAccount: this._id }
        ],
        date: { $lt: date }
      }
    },
    {
      $group: {
        _id: null,
        balance: {
          $sum: {
            $cond: [
              { $eq: ["$debitAccount", this._id] },
              "$amount",  // If debit, add amount
              { $multiply: ["$amount", -1] }  // If credit, subtract amount
            ]
          }
        }
      }
    }
  ]);
  
  if (transactionBalance.length > 0) {
    startingBalance += transactionBalance[0].balance;
  }
  
  return startingBalance;
};

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
