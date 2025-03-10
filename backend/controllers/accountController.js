const Account = require("../models/Account.model");
const Customer = require("../models/Customer");
const Transaction = require('../models/Transaction');
const Sale = require('../models/Sale.model');
const mongoose = require('mongoose');
const CompanySettings = require('../models/CompanySettings');

// Create new account
const createAccount = async (req, res) => {
  try {
    const newAccount = new Account(req.body);
    const savedAccount = await newAccount.save();
    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: savedAccount,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to create account",
      error: error.message,
    });
  }
};

// Get single account
const getAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }
    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to fetch account",
      error: error.message,
    });
  }
};

const getAllAccounts = async (req, res) => {
  try {
    const accounts = await Account.find();
    res.status(200).json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to fetch accounts",
      error: error.message,
    });
  }
};

// Get accounts with search parameters
const getAccounts = async (req, res) => {
  try {
    const { accountType, search } = req.query;
    
    // Build query object
    let query = {};
    
    // Add accountType filter if provided
    if (accountType) {
      query.accountType = accountType;
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { accountName: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { contactNo: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Find accounts
    const accounts = await Account.find(query)
      .sort({ accountName: 1 });

    res.status(200).json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to fetch accounts",
      error: error.message,
    });
  }
};

// Update account
const updateAccount = async (req, res) => {
  try {
    const updatedAccount = await Account.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedAccount) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Account updated successfully",
      data: updatedAccount,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update account",
      error: error.message,
    });
  }
};

const getSalesLedger = async (req, res) => {
  try {
    const { dateRange, startDate, endDate } = req.query;
    
    // Get the sales account
    const salesAccount = await Account.findOne({ 
      accountType: 'Sale', 
      accountName: 'Sales Account' 
    });

    if (!salesAccount) {
      return res.status(404).json({
        success: false,
        message: 'Sales account not found'
      });
    }

    // Calculate date range
    let start, end;
    if (dateRange === 'monthly') {
      start = new Date();
      start.setDate(1); // First day of current month
      start.setHours(0, 0, 0, 0);
      
      end = new Date();
      end.setMonth(end.getMonth() + 1, 0); // Last day of current month
      end.setHours(23, 59, 59, 999);
    } else {
      start = startDate ? new Date(startDate) : new Date();
      end = endDate ? new Date(endDate) : new Date();
    }

    // Get transactions
    const transactions = await Transaction.find({
      $or: [
        { debitAccount: salesAccount._id },
        { creditAccount: salesAccount._id }
      ],
      date: {
        $gte: start,
        $lte: end
      }
    }).sort({ date: 1 });

    // Calculate opening balance
    const openingBalance = await Transaction.aggregate([
      {
        $match: {
          $or: [
            { debitAccount: salesAccount._id },
            { creditAccount: salesAccount._id }
          ],
          date: { $lt: start }
        }
      },
      {
        $group: {
          _id: null,
          balance: {
            $sum: {
              $cond: [
                { $eq: ["$creditAccount", salesAccount._id] },
                "$amount",
                { $multiply: ["$amount", -1] }
              ]
            }
          }
        }
      }
    ]);

    // Calculate running balance
    let runningBalance = openingBalance[0]?.balance || 0;
    const formattedTransactions = await Promise.all(transactions.map(async t => {
      const isCredit = t.creditAccount.toString() === salesAccount._id.toString();
      const amount = t.amount;
      runningBalance += isCredit ? amount : -amount;

      // Get related sale and customer info
      const saleInfo = await Sale.findOne({ transactions: t._id })
        .populate('customer', 'name');
      
      const description = saleInfo 
        ? `Sale #${saleInfo.saleNumber} to Customer ${saleInfo.customer.name}`
        : t.description;

      return {
        _id: t._id,
        date: t.date,
        particulars: description,
        type: isCredit ? 'credit' : 'debit',
        amount: amount,
        runningBalance
      };
    }));

    res.json({
      success: true,
      data: {
        openingBalance: openingBalance[0]?.balance || 0,
        closingBalance: runningBalance,
        transactions: formattedTransactions
      }
    });

  } catch (error) {
    console.error('Error in getSalesLedger:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getCustomerLedger = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { startDate, endDate } = req.query;

    // Find the account and associated customer
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Calculate date range
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

    // Get transactions
    const transactions = await Transaction.find({
      $or: [
        { debitAccount: accountId },
        { creditAccount: accountId }
      ],
      date: {
        $gte: start,
        $lte: end
      }
    }).sort({ date: 1 });

    // Calculate opening balance
    const openingBalance = await Transaction.aggregate([
      {
        $match: {
          $or: [
            { debitAccount: account._id },
            { creditAccount: account._id }
          ],
          date: { $lt: start }
        }
      },
      {
        $group: {
          _id: null,
          balance: {
            $sum: {
              $cond: [
                { $eq: ["$creditAccount", account._id] },
                "$amount",
                { $multiply: ["$amount", -1] }
              ]
            }
          }
        }
      }
    ]);

    // Calculate running balance
    let runningBalance = openingBalance[0]?.balance || 0;
    const formattedTransactions = await Promise.all(transactions.map(async t => {
      const isCredit = t.creditAccount.toString() === account._id.toString();
      const amount = t.amount;
      runningBalance += isCredit ? amount : -amount;

      // Get related sale info
      const saleInfo = await Sale.findOne({ transactions: t._id });
      
      const description = saleInfo.description;
      return {
        _id: t._id,
        date: t.date,
        particulars: description,
        type: isCredit ? 'credit' : 'debit',
        amount: amount,
        runningBalance
      };
    }));

    res.json({
      success: true,
      data: {
        openingBalance: openingBalance[0]?.balance || 0,
        closingBalance: runningBalance,
        transactions: formattedTransactions
      }
    });

  } catch (error) {
    console.error('Error in getCustomerLedger:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getCashLedger = async (req, res) => {
  try {
    const { dateRange, startDate, endDate } = req.query;
    
    // Get the cash account
    const cashAccount = await Account.findOne({ 
      accountType: 'Cash', 
      accountName: 'Cash in Hand' 
    });

    if (!cashAccount) {
      return res.status(404).json({
        success: false,
        message: 'Cash account not found'
      });
    }

    // Calculate date range
    let start, end;
    if (dateRange === 'monthly') {
      start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      
      end = new Date();
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      start = startDate ? new Date(startDate) : new Date();
      end = endDate ? new Date(endDate) : new Date();
    }

    // Get transactions
    const transactions = await Transaction.find({
      $or: [
        { debitAccount: cashAccount._id },
        { creditAccount: cashAccount._id }
      ],
      date: {
        $gte: start,
        $lte: end
      }
    }).sort({ date: 1 });

    // Calculate opening balance
    const openingBalance = await Transaction.aggregate([
      {
        $match: {
          $or: [
            { debitAccount: cashAccount._id },
            { creditAccount: cashAccount._id }
          ],
          date: { $lt: start }
        }
      },
      {
        $group: {
          _id: null,
          balance: {
            $sum: {
              $cond: [
                { $eq: ["$debitAccount", cashAccount._id] },
                "$amount",
                { $multiply: ["$amount", -1] }
              ]
            }
          }
        }
      }
    ]);

    let runningBalance = openingBalance[0]?.balance || 0;

    const formattedTransactions = await Promise.all(transactions.map(async t => {
      const isDebit = t.debitAccount.toString() === cashAccount._id.toString();
      const amount = t.amount;
      runningBalance += isDebit ? amount : -amount;

      return {
        _id: t._id,
        date: t.date,
        particulars: t.description,
        type: isDebit ? 'debit' : 'credit',
        amount: amount,
        runningBalance
      };
    }));

    res.json({
      success: true,
      data: {
        openingBalance: openingBalance[0]?.balance || 0,
        closingBalance: runningBalance,
        transactions: formattedTransactions
      }
    });

  } catch (error) {
    console.error('Error in getCashLedger:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getBankLedger = async (req, res) => {
  try {
    const { dateRange, startDate, endDate } = req.query;
    
    // Get the bank account
    const bankAccount = await Account.findOne({ 
      accountType: 'Bank', 
      accountName: 'Bank Account' 
    });

    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        message: 'Bank account not found'
      });
    }

    // Calculate date range
    let start, end;
    if (dateRange === 'monthly') {
      start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      
      end = new Date();
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      start = startDate ? new Date(startDate) : new Date();
      end = endDate ? new Date(endDate) : new Date();
    }

    // Get transactions
    const transactions = await Transaction.find({
      $or: [
        { debitAccount: bankAccount._id },
        { creditAccount: bankAccount._id }
      ],
      date: {
        $gte: start,
        $lte: end
      }
    }).sort({ date: 1 });

    // Calculate opening balance
    const openingBalance = await Transaction.aggregate([
      {
        $match: {
          $or: [
            { debitAccount: bankAccount._id },
            { creditAccount: bankAccount._id }
          ],
          date: { $lt: start }
        }
      },
      {
        $group: {
          _id: null,
          balance: {
            $sum: {
              $cond: [
                { $eq: ["$debitAccount", bankAccount._id] },
                "$amount",
                { $multiply: ["$amount", -1] }
              ]
            }
          }
        }
      }
    ]);

    let runningBalance = openingBalance[0]?.balance || 0;

    const formattedTransactions = await Promise.all(transactions.map(async t => {
      const isDebit = t.debitAccount.toString() === bankAccount._id.toString();
      const amount = t.amount;
      runningBalance += isDebit ? amount : -amount;

      return {
        _id: t._id,
        date: t.date,
        particulars: t.description,
        type: isDebit ? 'debit' : 'credit',
        amount: amount,
        runningBalance
      };
    }));

    res.json({
      success: true,
      data: {
        openingBalance: openingBalance[0]?.balance || 0,
        closingBalance: runningBalance,
        transactions: formattedTransactions
      }
    });

  } catch (error) {
    console.error('Error in getBankLedger:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getAccountLedger = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { dateRange, startDate, endDate } = req.query;

    // Find the account
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Set date range based on parameters
    let start, end;
    const now = new Date();
    
    if (dateRange === 'all_time') {
      start = new Date(2000, 0, 1); // January 1, 2000 (or any early date)
      end = new Date();
      end.setHours(23, 59, 59, 999); // End of current day
    } else {
      start = startDate 
        ? new Date(startDate) 
        : new Date(now.getFullYear(), now.getMonth(), 1); // Default: start of current month
      end = endDate 
        ? new Date(endDate) 
        : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // Default: end of current month
    }

    // Validate dates
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'startDate must be before endDate'
      });
    }

    // Calculate opening balance
    const openingBalance = await account.calculateOpeningBalance(start);

    // Get transactions for the period with populated references
    const transactions = await Transaction.find({
      $or: [
        { debitAccount: accountId },
        { creditAccount: accountId }
      ],
      date: {
        $gte: start,
        $lte: end
      }
    })
    .populate({
      path: 'saleRef',
      populate: { path: 'customer', select: 'name' }
    })
    .populate('purchaseRef')
    .populate('debitAccount', 'accountName accountType')
    .populate('creditAccount', 'accountName accountType')
    .sort({ date: 1 });

    // Process transactions to calculate running balance
    let runningBalance = openingBalance;
    const formattedTransactions = transactions.map(t => {
      const isDebit = t.debitAccount._id.toString() === account._id.toString();
      const amount = t.amount;
      
      // Update running balance
      if (isDebit) {
        runningBalance += amount;
      } else {
        runningBalance -= amount;
      }

      // Determine transaction description based on account perspective
      // contextDescriptions is an object with account IDs as keys and descriptions as values
      let particulars;
      if (isDebit) {
        particulars = t.contextDescriptions?.get(t.debitAccount._id.toString()) || 'Debit transaction';
      } else {
        particulars = t.contextDescriptions?.get(t.creditAccount._id.toString()) || 'Credit transaction';
      }

      return {
        _id: t._id,
        date: t.date,
        particulars,
        type: isDebit ? 'debit' : 'credit',
        amount: amount,
        runningBalance: runningBalance
      };
    });

    return res.json({
      success: true,
      data: {
        openingBalance,
        transactions: formattedTransactions,
        closingBalance: runningBalance
      }
    });
    
  } catch (error) {
    console.error('Error in getAccountLedger:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch account ledger',
      error: error.message
    });
  }
};

const createTransfer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
      const {
          fromAccountId,
          toAccountId,
          amount,
          notes
      } = req.body.transferData;

      if (!req.user || !req.user._id) {
          throw new Error('User not authenticated');
      }

      // Get the accounts
      const [fromAccount, toAccount] = await Promise.all([
          Account.findById(fromAccountId).session(session),
          Account.findById(toAccountId).session(session)
      ]);

      if (!fromAccount || !toAccount) {
          throw new Error('Required accounts not found');
      }

      // Get transfer number from settings
      const settings = await CompanySettings.findOne().session(session);
      const transferNumber = `TRF-${settings.numberSequences.lastTransferNumber + 1}`;

      // Create transfer transaction with context-aware descriptions
      const transferTransaction = new Transaction({
          contextDescriptions: {
              [fromAccount._id.toString()]: `Transfer to ${toAccount.accountName}`,
              [toAccount._id.toString()]: `Transfer from ${fromAccount.accountName}`
          },
          description: `Transfer from ${fromAccount.accountName} to ${toAccount.accountName}`,
          transactionNumber: transferNumber,
          amount: amount,
          date: new Date(),
          debitAccount: toAccount._id,    // Account receiving the transfer
          creditAccount: fromAccount._id, // Account sending the transfer
          createdBy: req.user._id,
          transactionType: 'Transfer',
          notes
      });

      // Update account balances
      await Promise.all([
          Account.findByIdAndUpdate(
              fromAccount._id,
              { $inc: { balance: -amount } }, // Decrease sending account balance
              { session }
          ),
          Account.findByIdAndUpdate(
              toAccount._id,
              { $inc: { balance: amount } },  // Increase receiving account balance
              { session }
          )
      ]);

      // Save all changes
      await Promise.all([
          transferTransaction.save({ session }),
          CompanySettings.findOneAndUpdate(
              {},
              { $inc: { 'numberSequences.lastTransferNumber': 1 } },
              { session }
          )
      ]);

      await session.commitTransaction();

      res.status(200).json({
          success: true,
          data: {
              transfer: transferTransaction,
              fromAccount: {
                  id: fromAccount._id,
                  name: fromAccount.accountName,
                  updatedBalance: fromAccount.balance - amount
              },
              toAccount: {
                  id: toAccount._id,
                  name: toAccount.accountName,
                  updatedBalance: toAccount.balance + amount
              }
          }
      });

  } catch (error) {
      await session.abortTransaction();
      res.status(400).json({
          success: false,
          message: error.message
      });
  } finally {
      session.endSession();
  }
};

const createPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { 
            accountId,
            paymentAccountId,
            amount, 
            paymentType,
            date = new Date(),
            notes
        } = req.body;

        if (!req.user || !req.user._id) {
            throw new Error('User not authenticated');
        }

        // Get the accounts
        const [account, paymentAccount] = await Promise.all([
            Account.findById(accountId).session(session),
            Account.findById(paymentAccountId).session(session)
        ]);

        if (!account || !paymentAccount) {
            throw new Error('Required accounts not found');
        }

        // Get payment number from settings
        const settings = await CompanySettings.findOne().session(session);
        const paymentNumber = `PAY-${settings.numberSequences.lastPaymentNumber + 1}`;

        // Create payment transaction with context-aware descriptions
        const paymentTransaction = new Transaction({
            contextDescriptions: {
                [paymentAccount._id.toString()]: paymentType === 'receive' 
                    ? `Cash received from ${account.accountName}`
                    : `Cash paid to ${account.accountName}`,
                [account._id.toString()]: paymentType === 'receive'
                    ? `Payment made to ${paymentAccount.accountName}`
                    : `Payment received from ${paymentAccount.accountName}`
            },
            description: `Payment ${paymentType === 'receive' ? 'received from' : 'made to'} ${account.accountName}`,
            transactionNumber: paymentNumber,
            amount: amount,
            date: new Date(date),
            debitAccount: paymentType === 'receive' ? paymentAccount._id : account._id,
            creditAccount: paymentType === 'receive' ? account._id : paymentAccount._id,
            createdBy: req.user._id,
            transactionType: 'Payment',
            notes
        });

        // Update account balances based on payment type
        const updates = paymentType === 'receive' ? {
            debitAccountUpdate: amount,    // Increase cash/bank
            creditAccountUpdate: -amount   // Decrease customer balance
        } : {
            debitAccountUpdate: amount,    // Increase supplier balance
            creditAccountUpdate: -amount   // Decrease cash/bank
        };

        await Promise.all([
            Account.findByIdAndUpdate(
                paymentTransaction.debitAccount,
                { $inc: { balance: updates.debitAccountUpdate } },
                { session }
            ),
            Account.findByIdAndUpdate(
                paymentTransaction.creditAccount,
                { $inc: { balance: updates.creditAccountUpdate } },
                { session }
            )
        ]);

        // Save all changes
        await Promise.all([
            paymentTransaction.save({ session }),
            CompanySettings.findOneAndUpdate(
                {},
                { $inc: { 'numberSequences.lastPaymentNumber': 1 } },
                { session }
            )
        ]);

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            data: {
                payment: paymentTransaction,
                account: {
                    id: account._id,
                    name: account.accountName,
                    updatedBalance: account.balance + updates.creditAccountUpdate
                }
            }
        });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        session.endSession();
    }
};

module.exports = {
  createAccount,
  getAccount,
  updateAccount,
  getAllAccounts,
  getAccounts,
  getSalesLedger,
  getCustomerLedger,
  getCashLedger,
  getBankLedger,
  getAccountLedger,
  createPayment,
  createTransfer
};
