const Customer = require('../models/Customer');
const CustomerTransaction = require('../models/CustomerTransaction');
const Sale = require('../models/Sale.model');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// Get all customers
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find()
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single customer
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Create customer
exports.createCustomer = async (req, res) => {
  try {
    const {
      name,
      contactNumber,
      address,
      whatsappNotification,
      openingBalance,
      currentBalance
    } = req.body;

    const customer = await Customer.create({
      name,
      contactNumber,
      address,
      whatsappNotification,
      openingBalance,
      currentBalance,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    await customer.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Create Sale for customer
exports.createInvoice = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    const Sale = await Sale.create({
      ...req.body,
      customer: req.params.id,
      createdBy: req.user._id
    });

    // Update customer's invoices array
    await customer.addInvoice(Sale._id);

    res.status(201).json({
      success: true,
      data: Sale
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

exports.getCustomerLedger = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { startDate, endDate } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get all transactions for this customer
    const transactions = await Transaction.find({
      $or: [
        { debitAccount: customerId },
        { creditAccount: customerId }
      ],
      date: { $gte: start, $lte: end }
    })
    .sort({ date: 1 })
    .populate('saleRef', 'saleNumber');

    let runningBalance = 0;
    // Get opening balance
    const openingBalance = await Transaction.aggregate([
      {
        $match: {
          $or: [
            { debitAccount: mongoose.Types.ObjectId(customerId) },
            { creditAccount: mongoose.Types.ObjectId(customerId) }
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
                { $eq: ["$debitAccount", mongoose.Types.ObjectId(customerId)] },
                "$amount",
                { $multiply: ["$amount", -1] }
              ]
            }
          }
        }
      }
    ]);

    runningBalance = openingBalance[0]?.balance || 0;

    const ledgerEntries = transactions.map(t => {
      const isDebit = t.debitAccount.toString() === customerId.toString();
      const amount = t.amount;
      
      // Update running balance
      if (isDebit) {
        runningBalance += amount;
      } else {
        runningBalance -= amount;
      }

      // Get context-aware description
      let description;
      
      if (t.saleRef) {
        if (t.description.includes('Payment')) {
          description = `Payment for Sale #${t.saleRef.saleNumber}`;
        } else if (t.description.includes('Advance')) {
          description = `Advance Payment from Sale #${t.saleRef.saleNumber}`;
        } else {
          description = `Sale #${t.saleRef.saleNumber}`;
        }
      } else {
        // Use context-specific description for the customer's perspective
        description = t.contextDescriptions?.[customerId.toString()] || t.description;
      }

      return {
        _id: t._id,
        date: t.date,
        particulars: description,
        type: isDebit ? 'debit' : 'credit',
        amount: amount,
        runningBalance: runningBalance
      };
    });

    res.json({
      success: true,
      data: {
        openingBalance: openingBalance[0]?.balance || 0,
        entries: ledgerEntries,
        closingBalance: runningBalance
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

exports.getCustomerLedgerSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Default period: Current month
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

    const customer = await Customer.findOne({ _id: id, createdBy: req.user._id });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Fetch invoices within the selected period
    const invoices = await Sale.find({
      customer: customer._id,
      createdAt: { $gte: start, $lte: end }
    }).populate({
      path: 'items.itemId',
      select: 'name unit category'
    });
    // Calculate total Sale amount within the period
    const totalInvoiceAmount = invoices.reduce((sum, Sale) => sum + (Sale.grandTotal || 0), 0);

    // Summarize products and livestock
    const productSummary = { totalAmount: 0, products: { milk: { quantity: 0, amount: 0, unit: 'L' }, eggs: { quantity: 0, amount: 0, unit: 'pcs' }, other: { quantity: 0, amount: 0, unit: 'units' } } };
    const livestockSummary = { totalAmount: 0, items: {} };

    invoices.forEach(Sale => {
      Sale.items.forEach(item => {
        if (!item || !item.itemId) return;
        const productName = item.name ? item.name.toLowerCase() : '';

        if (item.itemType === 'Product') {
          productSummary.totalAmount += item.total || 0;
          if (productName.includes('milk')) {
            productSummary.products.milk.quantity += item.quantity || 0;
            productSummary.products.milk.amount += item.total || 0;
          } else if (productName.includes('eggs')) {
            productSummary.products.eggs.quantity += item.quantity || 0;
            productSummary.products.eggs.amount += item.total || 0;
          } else {
            productSummary.products.other.quantity += item.quantity || 0;
            productSummary.products.other.amount += item.total || 0;
          }
        } else if (item.itemType === 'Livestock') {
          livestockSummary.totalAmount += item.total || 0;
          const productId = item.itemId._id.toString();
          if (!livestockSummary.items[productId]) {
            livestockSummary.items[productId] = { name: item.name || 'Unknown', quantity: 0, amount: 0, unit: item.unit || 'kg' };
          }
          livestockSummary.items[productId].quantity += item.quantity || 0;
          livestockSummary.items[productId].amount += item.total || 0;
        }
      });
    });

    // Fetch transactions within the same period
    const transactions = await CustomerTransaction.find({
      customerId: customer._id,
      'transactions.date': { $gte: start, $lte: end }
    });

    // Calculate transaction summary
    const transactionSummary = {
      totalTransactions: transactions.reduce((sum, trans) => sum + (trans.transactions?.length || 0), 0),
      totalAmount: transactions.reduce((sum, trans) => sum + (trans.transactions || []).reduce((tSum, t) => tSum + (t.amount || 0), 0), 0),
      byMode: transactions.reduce((modes, trans) => {
        (trans.transactions || []).forEach(t => {
          if (t.modeOfPayment) {
            modes[t.modeOfPayment] = (modes[t.modeOfPayment] || 0) + (t.amount || 0);
          }
        });
        return modes;
      }, {})
    };

    res.json({
      success: true,
      data: {
        period: { from: start, to: end },
        customerInfo: { name: customer.name || '', contactNumber: customer.contactNumber || '', address: customer.address || '' },
        transactions: transactionSummary,
        products: productSummary,
        livestock: livestockSummary,
        invoices: {
          count: invoices.length,
          totalAmount: totalInvoiceAmount
        },
        balances: {
          opening: customer.openingBalance || 0,
          current: customer.currentBalance || 0,
          net: (customer.currentBalance || 0) - (customer.openingBalance || 0)
        }
      }
    });

  } catch (error) {
    console.error('Error in getCustomerLedgerSummary:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get customer statistics
exports.getCustomerStats = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    const stats = {
      totalPurchases: customer.totalPurchases,
      currentBalance: customer.currentBalance,
      lastPurchaseDate: customer.lastPurchaseDate,
      invoiceCount: customer.invoices.length,
      transactionCount: customer.transactions.length
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Search customers
exports.searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;
    console.log('Search query received:', q);
    
    // Verify Customer model is loaded
    console.log('Customer model:', !!Customer);
    
    if (!q || q.length < 2) {
      console.log('Search query too short');
      return res.json({ success: true, data: [] });
    }

    // Test database connection
    try {
      await Customer.db.collection('customers').stats();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      throw new Error('Database connection failed');
    }

    // Basic search with error catching
    const searchQuery = { name: { $regex: q, $options: 'i' } };
    console.log('Executing search with query:', searchQuery);

    const customers = await Customer.find(searchQuery)
      .select('name currentBalance contactNumber')
      .limit(10)
      .lean()
      .exec();

    console.log('Search completed. Results:', customers);

    return res.json({ 
      success: true, 
      data: customers || [] 
    });

  } catch (error) {
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Send a more detailed error response
    return res.status(500).json({ 
      success: false, 
      message: 'Error searching customers',
      errorDetails: {
        message: error.message,
        type: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
}; 