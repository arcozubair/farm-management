const Customer = require('../models/Customer');
const CustomerTransaction = require('../models/CustomerTransaction');
const Invoice = require('../models/Invoice');

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

// Create invoice for customer
exports.createInvoice = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    const invoice = await Invoice.create({
      ...req.body,
      customer: req.params.id,
      createdBy: req.user._id
    });

    // Update customer's invoices array
    await customer.addInvoice(invoice._id);

    res.status(201).json({
      success: true,
      data: invoice
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
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // If no dates provided, default to current month
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

    const customer = await Customer.findOne({
      _id: id,
      createdBy: req.user._id
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get transactions with date filter
    const transactions = await CustomerTransaction.find({
      customerId: customer._id,
      'transactions.date': {
        $gte: start,
        $lte: end
      }
    }).select('transactions currentBalance createdAt');

    // Get invoices with date filter
    const invoices = await Invoice.find({
      customer: customer._id,
      createdAt: {
        $gte: start,
        $lte: end
      }
    }).select('invoiceNumber grandTotal remainingBalance createdAt');

<<<<<<< HEAD
    // Format transactions - keep exact timestamp
    const formattedTransactions = transactions.flatMap(trans => 
      (trans.transactions || []).map(t => ({
        date: t.date,
        exactTimestamp: new Date(t.date).getTime(),
=======
    // Format transactions
    const formattedTransactions = transactions.flatMap(trans => 
      (trans.transactions || []).map(t => ({
        date: t.date,
>>>>>>> bd717611ca45c98ffa02d45267fe3933ea3f7ddd
        type: "Transaction",
        description: `Transaction - Receipt #${t.transactionNumber}`,
        amount: -t.amount,
        transactionMode: t.modeOfPayment,
<<<<<<< HEAD
=======
        createdAt: trans.createdAt,
>>>>>>> bd717611ca45c98ffa02d45267fe3933ea3f7ddd
        balanceAfterEntry: trans.currentBalance
      }))
    );

<<<<<<< HEAD
    // Format invoices - keep exact timestamp
    const formattedInvoices = invoices.map(invoice => ({
      date: invoice.createdAt,
      exactTimestamp: new Date(invoice.createdAt).getTime(),
=======
    // Format invoices
    const formattedInvoices = invoices.map(invoice => ({
      date: invoice.createdAt,
>>>>>>> bd717611ca45c98ffa02d45267fe3933ea3f7ddd
      type: "Invoice",
      description: `Invoice #${invoice.invoiceNumber}`,
      amount: invoice.grandTotal,
      remainingBalance: invoice.remainingBalance,
      transactionMode: null,
<<<<<<< HEAD
      balanceAfterEntry: invoice.remainingBalance
    }));

    // Combine and sort all entries by exact timestamp
    const ledgerDetails = [...formattedTransactions, ...formattedInvoices]
      .sort((a, b) => a.exactTimestamp - b.exactTimestamp);
=======
      createdAt: invoice.createdAt,
      balanceAfterEntry: invoice.remainingBalance
    }));

    // Combine and sort all entries
    const ledgerDetails = [...formattedTransactions, ...formattedInvoices]
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
>>>>>>> bd717611ca45c98ffa02d45267fe3933ea3f7ddd

    // Calculate running balance
    let runningBalance = customer.openingBalance;
    ledgerDetails.forEach(entry => {
      runningBalance += entry.amount;
      entry.balanceAfterEntry = runningBalance;
<<<<<<< HEAD
      // Remove exactTimestamp from final output
      delete entry.exactTimestamp;
=======
>>>>>>> bd717611ca45c98ffa02d45267fe3933ea3f7ddd
    });

    res.json({
      success: true,
      data: {
        customerInfo: {
          name: customer.name,
          contactNumber: customer.contactNumber,
          address: customer.address
        },
        startingBalance: customer.openingBalance,
        currentBalance: runningBalance,
        ledgerDetails
      }
    });

  } catch (error) {
    console.error('Error in getCustomerLedger:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCustomerLedgerSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

    const customer = await Customer.findOne({
      _id: id,
      createdBy: req.user._id
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get invoices with populated items
    const invoices = await Invoice.find({
      customer: customer._id,
      createdAt: {
        $gte: start,
        $lte: end
      }
    }).populate({
      path: 'items.itemId',
      select: 'name unit category'
    });

    // Initialize summaries
    const productSummary = {
      totalAmount: 0,
      products: {
        milk: { quantity: 0, amount: 0, unit: 'L' },
        eggs: { quantity: 0, amount: 0, unit: 'pcs' },
        other: { quantity: 0, amount: 0, unit: 'units' }
      }
    };

    const livestockSummary = {
      totalAmount: 0,
      items: {}
    };

    // Process invoices
    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        // Skip if item or itemId is not properly populated
        if (!item || !item.itemId) return;

        const product = item.itemId;
        const productName = item.name ? item.name.toLowerCase() : '';

        console.log("ssss",item.name);

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

          const productId = product._id.toString();
          if (!livestockSummary.items[productId]) {
            livestockSummary.items[productId] = {
              name: item.name || 'Unknown',
              quantity: 0,
              amount: 0,
              unit: item.unit || 'kg'
            };
          }
          livestockSummary.items[productId].quantity += item.quantity || 0;
          livestockSummary.items[productId].amount += item.total || 0;
        }
      });
    });

    // Get transactions
    const transactions = await CustomerTransaction.find({
      customerId: customer._id,
      'transactions.date': {
        $gte: start,
        $lte: end
      }
    });

    // Calculate transaction summary
    const transactionSummary = {
      totalTransactions: transactions.reduce((sum, trans) => sum + (trans.transactions?.length || 0), 0),
      totalAmount: transactions.reduce((sum, trans) => 
        sum + (trans.transactions || []).reduce((tSum, t) => tSum + (t.amount || 0), 0), 0),
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
        period: {
          from: start,
          to: end
        },
        customerInfo: {
          name: customer.name || '',
          contactNumber: customer.contactNumber || '',
          address: customer.address || ''
        },
        transactions: transactionSummary,
        products: productSummary,
        livestock: livestockSummary,
        balances: {
          opening: customer.openingBalance || 0,
          current: customer.currentBalance || 0,
          net: (customer.currentBalance || 0) - (customer.openingBalance || 0)
        }
      }
    });

  } catch (error) {
    console.error('Error in getCustomerLedgerSummary:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
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