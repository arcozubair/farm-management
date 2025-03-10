const CompanySettings = require('../models/CompanySettings');
const Customer = require('../models/Customer');
const CustomerTransaction = require('../models/CustomerTransaction');
const DayBook = require('../models/DayBook');
const Product = require('../models/Product');
const Sale = require('../models/Sale.model');
const StockMovement = require('../models/StockMovement');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

exports.addTransaction = async (req, res) => {
  try {
    const { date, customerId, amountPaid, paymentMode } = req.body;

    // Find company settings and get transaction number
    const settings = await CompanySettings.findOne();
    if (!settings) {
      return res.status(404).json({ 
        success: false, 
        message: 'Company settings not found' 
      });
    }

    // Get current number and increment it
    const currentNumber = settings.numberSequences.lastTransactionNumber + 1;
    const prefix = settings.prefixes.transactionPrefix;
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    const transactionNumber = `${prefix}-${year}${month}-${currentNumber.toString().padStart(5, '0')}`;
    
    // Update the sequence
    settings.numberSequences.lastTransactionNumber = currentNumber;
    await settings.save();

    console.log('Generated transaction number:', transactionNumber);

    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);

    // Get customer and verify
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const previousBalance = customer.currentBalance;
    const currentBalance = previousBalance - amountPaid;

    // Update customer balance
    customer.currentBalance = currentBalance;

    // Find or create customer transaction record
    let customerTransaction = await CustomerTransaction.findOne({ customerId });
    if (!customerTransaction) {
      customerTransaction = new CustomerTransaction({
        customerId,
        currentBalance,
        transactions: []
      });
    }

    // Add to customer transactions
    const newCustomerTransaction = {
      transactionNumber,
      amount: amountPaid,
      modeOfPayment: paymentMode,
      date: new Date()
    };
    customerTransaction.transactions.push(newCustomerTransaction);
    customerTransaction.currentBalance = currentBalance;

    

    // Add transaction to daybook
    let dayBook = await DayBook.findOne({ date: formattedDate });
    
    if (!dayBook) {
      dayBook = new DayBook({
        date: formattedDate,
        collections: [],
        transactions: [],
        summary: { totalMilk: 0, totalEggs: 0, totalPayments: 0 }
      });
    }

    dayBook.transactions.push({
      customerId,
      amountPaid,
      previousBalance,
      currentBalance,
      paymentMode,
      transactionNumber
    });

    dayBook.summary.totalPayments += Number(amountPaid);

    // Save all changes
    await Promise.all([
      dayBook.save(),
      customer.save(),
      customerTransaction.save()
    ]);

    res.json({ 
      success: true, 
      data: {
        dayBook,
        transactionNumber
      }
    });
  } catch (error) {
    console.error('Error in addTransaction:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.addCollection = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { date, productId, quantity, shift } = req.body;
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const exactTime = new Date();

    // Find or create daybook
    let dayBook = await DayBook.findOne({ 
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).session(session);

    if (!dayBook) {
      dayBook = await DayBook.create([{
        date: startOfDay,
        collections: [],
        transactions: [],
        summary: { totalCollections: 0 }
      }], { session });
      dayBook = dayBook[0];
    }

    // Get product and update stock
    const product = await Product.findById(productId).session(session);
    if (!product) {
      throw new Error(`Product not found`);
    }

    const previousStock = product.currentStock;
    const newStock = previousStock + Number(quantity);

    // Update product stock
    await Product.findByIdAndUpdate(
      productId,
      { $set: { currentStock: newStock } },
      { session }
    );

    // Create stock movement
    await StockMovement.create([{
      product: productId,
      date: exactTime,
      transactionType: 'Collection',
      quantity: Number(quantity),
      unit: product.unit,
      previousStock,
      currentStock: newStock,
      unitRate: product.rate,
      createdBy: req.user._id,
      reference: {
        type: 'Collection',
        id: dayBook._id
      }
    }], { session });

    // Add collection to daybook
    dayBook.collections.push({
      product: productId,
      quantity: Number(quantity),
      shift,
      createdAt: exactTime
    });

    // Update daybook summary
    dayBook.summary.totalCollections = (dayBook.summary.totalCollections || 0) + Number(quantity);
    await dayBook.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: {
        dayBook,
        message: 'Collection added successfully'
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

exports.getEntries = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    const dayBook = await DayBook.findOne({ date: queryDate })
      .populate('collections')
      .populate('transactions.customerId', 'name');

    if (!dayBook) {
      return res.json({
        success: true,
        data: {
          collections: [],
          transactions: [],
          summary: { totalMilk: 0, totalEggs: 0, totalPayments: 0 }
        }
      });
    }

    res.json({ success: true, data: dayBook });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


exports.getDayBookReport = async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      // Validate dates
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Please provide both startDate and endDate'
        });
      }

      // Convert dates to proper format
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include full end day

      // Query transactions
      const transactions = await Transaction.find({
        date: {
          $gte: start,
          $lte: end
        }
      })
      .populate('debitAccount', 'name code')  // Populate debit account details
      .populate('creditAccount', 'name code') // Populate credit account details
      .populate('saleRef', 'voucherNo')       // Populate sale reference
      .populate('purchaseRef', 'voucherNo')   // Populate purchase reference
      .populate('expenseRef', 'voucherNo')    // Populate expense reference
      .populate('collectionRef', 'voucherNo') // Populate collection reference
      .sort({ date: 1 });                     // Sort by date ascending

      // Format the response for Day Book
      const dayBookData = transactions.map(transaction => {
        // Determine voucher type and number
        let voucherType = '';
        let voucherNo = '';
        
        if (transaction.saleRef) {
          voucherType = 'Sale';
          voucherNo = transaction.saleRef.voucherNo || `SALE-${transaction._id.toString().slice(-6)}`;
        } else if (transaction.purchaseRef) {
          voucherType = 'Purchase';
          voucherNo = transaction.purchaseRef.voucherNo || `PUR-${transaction._id.toString().slice(-6)}`;
        } else if (transaction.expenseRef) {
          voucherType = 'Expense';
          voucherNo = transaction.expenseRef.voucherNo || `EXP-${transaction._id.toString().slice(-6)}`;
        } else if (transaction.collectionRef) {
          voucherType = 'Collection';
          voucherNo = transaction.collectionRef.voucherNo || `COL-${transaction._id.toString().slice(-6)}`;
        } else {
          voucherType = 'Journal';
          voucherNo = `JRN-${transaction._id.toString().slice(-6)}`;
        }

        // Get particulars from contextDescriptions
        const particulars = transaction.contextDescriptions 
          ? Object.values(transaction.contextDescriptions)[0] || transaction.description
          : transaction.description || 'No description';

        return {
          effectiveDate: transaction.date,
          particulars: particulars,
          voucher: voucherType,
          ledger: {
            debit: transaction.debitAccount?.name || 'Unknown',
            credit: transaction.creditAccount?.name || 'Unknown'
          },
          voucherNo: voucherNo,
          drAmount: transaction.amount,  // Debit amount
          crAmount: transaction.amount,  // Credit amount same as debit in this schema
          action: 'View'  // Could be expanded to include edit/delete based on requirements
        };
      });

      res.status(200).json({
        success: true,
        data: dayBookData,
        totalRecords: dayBookData.length,
        period: {
          from: start,
          to: end
        }
      });

    } catch (error) {
      console.error('Error generating day book report:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating day book report',
        error: error.message
      });
    }
  };

exports.getTransactionDetails=async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id)
      .populate('debitAccount', 'name code')
      .populate('creditAccount', 'name code')
      .populate('saleRef', 'voucherNo')
      .populate('purchaseRef', 'voucherNo')
      .populate('expenseRef', 'voucherNo')
      .populate('collectionRef', 'voucherNo');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction details',
      error: error.message
    });
  }
};



exports.getDayBook = async (req, res) => {
  try {
    const { date } = req.query;
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);

    const endDate = new Date(formattedDate);
    endDate.setHours(23, 59, 59, 999);

    // Get daybook data with populated customer info
    const dayBook = await DayBook.findOne({ date: formattedDate })
      .populate('transactions.customerId', 'name');

    // Calculate payments by mode
    const payments = {
      cash: 0,
      accountTransfer: 0
    };

    // Sum up payments by mode
    if (dayBook?.transactions) {
      dayBook.transactions.forEach(transaction => {
        if (transaction.paymentMode === 'cash') {
          payments.cash += Number(transaction.amountPaid) || 0;
        } else if (transaction.paymentMode === 'account') {
          payments.accountTransfer += Number(transaction.amountPaid) || 0;
        }
      });
    }

    // Get total sales amount from invoices for the date
    const invoices = await Sale.find({
      createdAt: {
        $gte: formattedDate,
        $lte: endDate
      }
    });

    const totalSales = invoices.reduce((sum, invoice) => sum + (invoice.grandTotal || 0), 0);

    // Prepare response with existing and new data
    const response = {
      success: true,
      data: {
        collections: dayBook?.collections || [],
        transactions: dayBook?.transactions || [],
        summary: {
          ...dayBook?.summary || {},
          totalSales,
          invoiceCount: invoices.length,
          payments: {
            cash: payments.cash,
            accountTransfer: payments.accountTransfer,
            total: payments.cash + payments.accountTransfer
          }
        },
        date: formattedDate
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getDayBook:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 