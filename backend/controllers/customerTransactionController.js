const CustomerTransaction = require('../models/CustomerTransaction');
const Customer = require('../models/Customer');

exports.addTransaction = async (req, res) => {
  try {
    const {
      customerId,
      amount,
      modeOfPayment,
      paymentDetails,
      notes
    } = req.body;

    // Find or create customer transaction record
    let customerTransaction = await CustomerTransaction.findOne({ customerId });
    
    if (!customerTransaction) {
      customerTransaction = new CustomerTransaction({
        customerId,
        currentBalance: 0,
        transactions: []
      });
    }

    // Create new transaction
    const newTransaction = {
      amount,
      modeOfPayment,
      paymentDetails,
      notes,
      date: new Date()
    };

    // Update current balance
    customerTransaction.currentBalance -= amount;
    customerTransaction.transactions.push(newTransaction);

    // Save transaction
    await customerTransaction.save();

    // Update customer's balance and add transaction reference
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    customer.currentBalance = customerTransaction.currentBalance;
    customer.transactions.push({
      transactionId: customerTransaction._id,
      date: newTransaction.date
    });

    await customer.save();

    // Send WhatsApp notification if enabled
    if (process.env.ENABLE_WHATSAPP_NOTIFICATIONS === 'true') {
      try {
        await sendWhatsAppNotification(customerId, newTransaction);
        newTransaction.notifiedOnWhatsapp = true;
        await customerTransaction.save();
      } catch (error) {
        console.error('WhatsApp notification failed:', error);
      }
    }

    res.json({
      success: true,
      data: {
        transaction: newTransaction,
        customerBalance: customer.currentBalance
      },
      message: 'Transaction recorded successfully'
    });

  } catch (error) {
    console.error('Error in addTransaction:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to record transaction'
    });
  }
};

exports.getCustomerHistory = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { startDate, endDate } = req.query;

    const customer = await Customer.findById(customerId)
      .select('name contactNumber currentBalance transactions')
      .populate({
        path: 'transactions.transactionId',
        select: 'transactions'
      });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    let transactions = customer.transactions;
    
    // Filter by date range if provided
    if (startDate && endDate) {
      transactions = transactions.filter(t => 
        t.date >= new Date(startDate) && 
        t.date <= new Date(endDate)
      );
    }

    res.json({
      success: true,
      data: {
        customerInfo: {
          name: customer.name,
          contactNumber: customer.contactNumber,
          currentBalance: customer.currentBalance
        },
        transactions: transactions.sort((a, b) => b.date - a.date)
      }
    });

  } catch (error) {
    console.error('Error in getCustomerHistory:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch transaction history'
    });
  }
}; 