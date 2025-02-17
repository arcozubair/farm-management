const CompanySettings = require('../models/CompanySettings');
const Customer = require('../models/Customer');
const CustomerTransaction = require('../models/CustomerTransaction');
const DayBook = require('../models/DayBook');
const Product = require('../models/Product');
const Sale = require('../models/Sale.model');

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
  try {
    const { date, type, quantity, shift } = req.body;
    
    console.log('Adding collection:', { date, type, quantity, shift });
    
    // Create date objects for start and end of the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Current exact time for the collection
    const exactTime = new Date();

    console.log('Searching between:', { startOfDay, endOfDay });
    console.log('Exact collection time:', exactTime);

    // Find daybook for this date using proper date range query
    let dayBook = await DayBook.findOne({ 
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    if (!dayBook) {
      dayBook = new DayBook({
        date: startOfDay,
        collections: [],
        transactions: [],
        summary: { totalMilk: 0, totalEggs: 0, totalPayments: 0 }
      });
    }

    // Add collection
    dayBook.collections.push({
      type,
      quantity,
      shift,
      createdAt: exactTime
    });

    // Update summary
    if (type === 'milk') {
      dayBook.summary.totalMilk += Number(quantity);
    } else if (type === 'eggs') {
      dayBook.summary.totalEggs += Number(quantity);
    }

    // Update product stock
    const product = await Product.findOne({ type });
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: `Product of type ${type} not found` 
      });
    }

    const previousStock = product.currentStock;
    product.currentStock += Number(quantity);

    // Add to stock history
    product.stockHistory.push({
      date: exactTime,
      transactionType: 'collection',
      quantity: Number(quantity),
      previousStock,
      currentStock: product.currentStock,
      shift,
      dayBookEntryId: dayBook._id
    });

    await product.save();
    console.log('Product updated successfully');

    // Save the daybook
    await dayBook.save();
    console.log('Daybook saved successfully');

    // Fetch the updated daybook to confirm changes
    const updatedDayBook = await DayBook.findById(dayBook._id)
      .populate('collections');
      
    console.log('Final daybook state:', updatedDayBook);

    res.json({ 
      success: true, 
      data: updatedDayBook,
      message: 'Collection recorded successfully'
    });

  } catch (error) {
    console.error('Error in addCollection:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to record collection'
    });
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