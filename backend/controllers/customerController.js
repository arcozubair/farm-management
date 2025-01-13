const Customer = require('../models/Customer');
const CustomerTransaction = require('../models/CustomerTransaction');

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

    console.log(startDate, endDate);

    const customer = await Customer.findOne({
      _id: id,
      createdBy: req.user._id
    }).populate({
      path: 'transactions.transactionId',
      model: 'CustomerTransaction',
      select: 'transactions currentBalance'
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get unique transactions by transactionId
    const uniqueTransactions = customer.transactions.reduce((acc, curr) => {
      const existingTrans = acc.find(t => 
        t.transactionId._id.toString() === curr.transactionId._id.toString() &&
        t.date.getTime() === new Date(curr.date).getTime()
      );
      
      if (!existingTrans) {
        acc.push(curr);
      }
      return acc;
    }, []);

    // Filter and format transactions
    const formattedTransactions = uniqueTransactions
      .filter(trans => {
        if (!startDate || !endDate) return true;
        const transDate = new Date(trans.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return transDate >= start && transDate <= end;
      })
      .map(trans => {
        const transactionDetails = trans.transactionId.transactions.find(t => 
          new Date(t.date).getTime() === new Date(trans.date).getTime()
        );
        
        if (!transactionDetails) return null;

        return {
          date: trans.date,
          transactionId: trans.transactionId._id,
          transactionNumber: transactionDetails.transactionNumber,
          amount: transactionDetails.amount,
          modeOfPayment: transactionDetails.modeOfPayment,
          notifiedOnWhatsapp: transactionDetails.notifiedOnWhatsapp,
          balanceAfter: trans.transactionId.currentBalance
        };
      })
      .filter(Boolean);

    // Calculate summary
    const summary = {
      totalTransactions: formattedTransactions.length,
      totalPayments: formattedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
      paymentModes: {
        cash: formattedTransactions
          .filter(t => t.modeOfPayment === 'cash')
          .reduce((sum, t) => sum + (t.amount || 0), 0),
        upi: formattedTransactions
          .filter(t => t.modeOfPayment === 'upi')
          .reduce((sum, t) => sum + (t.amount || 0), 0),
        bank_transfer: formattedTransactions
          .filter(t => t.modeOfPayment === 'bank_transfer')
          .reduce((sum, t) => sum + (t.amount || 0), 0)
      },
      openingBalance: customer.openingBalance,
      closingBalance: customer.currentBalance
    };

    res.json({
      success: true,
      data: {
        customerInfo: {
          name: customer.name,
          contactNumber: customer.contactNumber,
          address: customer.address,
          openingBalance: customer.openingBalance,
          currentBalance: customer.currentBalance,
          whatsappNotification: customer.whatsappNotification
        },
        summary,
        transactions: formattedTransactions.map(t => ({
          ...t,
          date: new Date(t.date).toLocaleDateString('en-IN'),
          amount: Number(t.amount).toFixed(2),
          balanceAfter: Number(t.balanceAfter).toFixed(2)
        }))
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
    const { year, month } = req.query;

    const customer = await Customer.findById(id)
      .select('name contactNumber currentBalance transactions')
      .populate({
        path: 'transactions.transactionId',
        model: 'CustomerTransaction',
        select: 'transactions'
      });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get monthly transactions
    let monthlyTransactions = [];
    customer.transactions.forEach(t => {
      if (t.transactionId && t.transactionId.transactions) {
        const transaction = t.transactionId.transactions[0];
        if (transaction) {
          const transDate = new Date(transaction.date);
          if (transDate >= startDate && transDate <= endDate) {
            monthlyTransactions.push({
              date: transaction.date,
              amount: transaction.amount,
              modeOfPayment: transaction.modeOfPayment
            });
          }
        }
      }
    });

    // Calculate monthly summary
    const monthlySummary = {
      month: `${startDate.toLocaleString('default', { month: 'long' })} ${year}`,
      totalTransactions: monthlyTransactions.length,
      totalAmount: monthlyTransactions.reduce((sum, t) => sum + t.amount, 0),
      paymentBreakdown: {
        cash: monthlyTransactions.filter(t => t.modeOfPayment === 'cash')
          .reduce((sum, t) => sum + t.amount, 0),
        upi: monthlyTransactions.filter(t => t.modeOfPayment === 'upi')
          .reduce((sum, t) => sum + t.amount, 0),
        bank_transfer: monthlyTransactions.filter(t => t.modeOfPayment === 'bank_transfer')
          .reduce((sum, t) => sum + t.amount, 0)
      },
      balanceSummary: {
        openingBalance: customer.currentBalance + monthlyTransactions.reduce((sum, t) => sum + t.amount, 0),
        closingBalance: customer.currentBalance
      }
    };

    res.json({
      success: true,
      data: {
        customerInfo: {
          name: customer.name,
          contactNumber: customer.contactNumber
        },
        summary: monthlySummary
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