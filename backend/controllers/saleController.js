const Sale = require('../models/Sale.model');
const Customer = require('../models/Customer');
const Livestock = require('../models/Livestock');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const CompanySettings = require('../models/CompanySettings');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { sendPdfToWhatsapp } = require('../utils/whatsappSender');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account.model');
const StockMovement = require('../models/StockMovement');
const LivestockMovement = require('../models/LivestockMovement');

exports.createSale = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { customer, items, paidAmount, grandTotal, saleNumber, date, paymentType, paymentDetails } = req.body;

        if (!req.user || !req.user._id) {
            throw new Error('User not authenticated');
        }

        // Parse the input date and ensure it includes time
        const transactionDate = date ? new Date(date) : new Date(); // Use input date with time, or current date/time if not provided
        if (isNaN(transactionDate.getTime())) {
            throw new Error('Invalid date provided');
        }

        // Create the sale document
        const sale = new Sale({
            saleNumber,
            date: transactionDate,
            customer,
            items,
            grandTotal,
            paidAmount: paidAmount || 0,
            remainingBalance: grandTotal - (paidAmount || 0),
            createdBy: req.user._id
        });

        await sale.save({ session });

        // Get required accounts
        const [salesAccount, customerAccount, paymentAccount] = await Promise.all([
            Account.findOne({ accountType: 'Sale', accountName: 'Sales Account' }).session(session),
            Account.findOne({ accountType: 'Customer', _id: customer }).session(session),
            paymentDetails?.accountId ? Account.findById(paymentDetails.accountId).session(session) : null
        ]);

        if (!salesAccount || !customerAccount || (paymentType === 'payment' && !paymentAccount)) {
            throw new Error('Required accounts not found');
        }

        // Create main sale transaction with contextDescriptions
        const saleTransaction = new Transaction({
            contextDescriptions: {
                [customerAccount._id.toString()]: `Receivable from sale #${saleNumber} to ${customerAccount.accountName} `,
                [salesAccount._id.toString()]: `Revenue from sale #${saleNumber}`
            },
            amount: grandTotal,
            debitAccount: customerAccount._id,
            creditAccount: salesAccount._id,
            date: transactionDate, 
            createdBy: req.user._id,
            saleRef: sale._id
        });

        await saleTransaction.save({ session });

        // Update account balances for sale
        await Promise.all([
            Account.findByIdAndUpdate(customerAccount._id, 
                { $inc: { balance: grandTotal } }, 
                { session }
            ),
            Account.findByIdAndUpdate(salesAccount._id, 
                { $inc: { balance: grandTotal } }, 
                { session }
            )
        ]);

        // Handle payment if any
        if (paymentType === 'payment' && paidAmount > 0) {
            const invoiceAdjustment = Math.min(paidAmount, grandTotal);
            
            const paymentTransaction = new Transaction({
                contextDescriptions: {
                    [paymentAccount._id.toString()]: `Cash received from ${customerAccount.accountName}`,
                    [customerAccount._id.toString()]: `Payment made to ${paymentAccount.accountName}`
                },
                amount: invoiceAdjustment,
                debitAccount: paymentAccount._id,
                creditAccount: customerAccount._id,
                date: transactionDate, // Includes time
                createdBy: req.user._id,
                saleRef: sale._id
            });

            await paymentTransaction.save({ session });

            if (paidAmount > grandTotal) {
                const advanceAmount = paidAmount - grandTotal;
                const advanceTransaction = new Transaction({
                    contextDescriptions: {
                        [paymentAccount._id.toString()]: `Advance cash received  from ${customerAccount.accountName}`,
                        [customerAccount._id.toString()]: `Advance payment made to ${paymentAccount.accountName}`
                    },
                    amount: advanceAmount,
                    debitAccount: paymentAccount._id,
                    creditAccount: customerAccount._id,
                    date: transactionDate, // Includes time
                    createdBy: req.user._id,
                    saleRef: sale._id
                });
                await advanceTransaction.save({ session });
            }

            await Promise.all([
                Account.findByIdAndUpdate(paymentAccount._id, 
                    { $inc: { balance: paidAmount } }, 
                    { session }
                ),
                Account.findByIdAndUpdate(customerAccount._id, 
                    { $inc: { balance: -paidAmount } }, 
                    { session }
                )
            ]);
        }

        // Update stock for items (including livestock)
        await Promise.all(items.map(async item => {
            if (item.itemType === 'Product') {
                const product = await Product.findById(item.itemId).session(session);
                if (!product) {
                    throw new Error(`Product not found: ${item.name}`);
                }

                if (product.currentStock < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}`);
                }

                await StockMovement.create([{
                    product: item.itemId,
                    date: transactionDate, // Includes time
                    transactionType: 'Sale',
                    quantity: item.quantity,
                    unit: product.unit,
                    previousStock: product.currentStock,
                    currentStock: product.currentStock - item.quantity,
                    unitRate: item.rate,
                    reference: {
                        type: 'Sale',
                        id: sale._id
                    },
                    createdBy: req.user._id
                }], { session });

                await Product.findByIdAndUpdate(
                    item.itemId,
                    { $inc: { currentStock: -item.quantity } },
                    { session }
                );
            } else if (item.itemType === 'Livestock') {
                const livestock = await Livestock.findById(item.itemId).session(session);
                if (!livestock) {
                    throw new Error(`Livestock not found: ${item.name}`);
                }

                if (livestock.quantity < item.quantity) {
                    throw new Error(`Insufficient livestock count for ${livestock.type}`);
                }

                await LivestockMovement.create([{
                    livestock: item.itemId,
                    date: transactionDate, // Includes time
                    transactionType: 'Sale',
                    quantity: item.quantity,
                    previousStock: livestock.quantity,
                    currentStock: livestock.quantity - item.quantity,
                    unitRate: item.rate || 0,
                    reference: {
                        type: 'Sale',
                        id: sale._id
                    },
                    createdBy: req.user._id
                }], { session });

                await Livestock.findByIdAndUpdate(
                    item.itemId,
                    { $inc: { quantity: -item.quantity } },
                    { session }
                );
            }
        }));

        await CompanySettings.findOneAndUpdate(
            {},
            { $inc: { 'numberSequences.lastSaleNumber': 1 } },
            { session }
        );

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            data: {
                sale,
                message: 'Sale recorded successfully'
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
// In your saleServices.js or similar backend file
exports.createMultipleSales = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const salesData = req.body; // Expecting an array of sale objects
        if (!Array.isArray(salesData)) {
            throw new Error('Expected an array of sales data');
        }

        const createdSales = [];

        for (const saleData of salesData) {
            const { customer, items, grandTotal, saleNumber, date } = saleData;

            if (!req.user || !req.user._id) {
                throw new Error('User not authenticated');
            }

            const transactionDate = date ? new Date(date) : new Date();
            if (isNaN(transactionDate.getTime())) {
                throw new Error('Invalid date provided');
            }

            const sale = new Sale({
                saleNumber,
                date: transactionDate,
                customer,
                items,
                grandTotal,
                paidAmount: 0, // Default to credit
                remainingBalance: grandTotal,
                createdBy: req.user._id,
                paymentType: 'credit'
            });

            await sale.save({ session });
            createdSales.push(sale);

            const [salesAccount, customerAccount] = await Promise.all([
                Account.findOne({ accountType: 'Sale', accountName: 'Sales Account' }).session(session),
                Account.findOne({ accountType: 'Customer', _id: customer }).session(session)
            ]);

            if (!salesAccount || !customerAccount) {
                throw new Error('Required accounts not found');
            }

            const saleTransaction = new Transaction({
                contextDescriptions: {
                    [customerAccount._id.toString()]: `Receivable from sale #${saleNumber} to ${customerAccount.accountName}`,
                    [salesAccount._id.toString()]: `Revenue from sale #${saleNumber}`
                },
                amount: grandTotal,
                debitAccount: customerAccount._id,
                creditAccount: salesAccount._id,
                date: transactionDate,
                createdBy: req.user._id,
                saleRef: sale._id
            });

            await saleTransaction.save({ session });

            await Promise.all([
                Account.findByIdAndUpdate(customerAccount._id, 
                    { $inc: { balance: grandTotal } }, 
                    { session }
                ),
                Account.findByIdAndUpdate(salesAccount._id, 
                    { $inc: { balance: grandTotal } }, 
                    { session }
                )
            ]);

            await Promise.all(items.map(async item => {
                const product = await Product.findById(item.itemId).session(session);
                if (!product || product.name.toLowerCase() !== 'milk') {
                    throw new Error(`Only milk is allowed for bulk sales: ${item.name}`);
                }

                if (product.currentStock < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}`);
                }

                await StockMovement.create([{
                    product: item.itemId,
                    date: transactionDate,
                    transactionType: 'Sale',
                    quantity: item.quantity,
                    unit: product.unit,
                    previousStock: product.currentStock,
                    currentStock: product.currentStock - item.quantity,
                    unitRate: item.rate,
                    reference: { type: 'Sale', id: sale._id },
                    createdBy: req.user._id
                }], { session });

                await Product.findByIdAndUpdate(
                    item.itemId,
                    { $inc: { currentStock: -item.quantity } },
                    { session }
                );
            }));

            await CompanySettings.findOneAndUpdate(
                {},
                { $inc: { 'numberSequences.lastSaleNumber': 1 } },
                { session }
            );
        }

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            data: createdSales,
            message: 'Bulk sales recorded successfully'
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

// Helper function to generate invoice number
async function generateSaleNumber() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    
    // Find the last invoice number for the current month
    const lastInvoice = await Sale.findOne({
        saleNumber: new RegExp(`^INV-${year}/${month}-`)
    }).sort({ saleNumber: -1 });
    
    let sequence = '00001';
    if (lastInvoice) {
        const lastSequence = lastInvoice.saleNumber.split('-').pop();
        sequence = String(Number(lastSequence) + 1).padStart(5, '0');
    }
    
    return `INV-${year}/${month}-${sequence}`;
}

exports.updateSale = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        console.log("this is req.body",req.params);
        const saleId  = req.params.id; // Assume saleId is passed as a URL parameter
        const { customer, items, paidAmount, grandTotal, saleNumber, date, paymentType, paymentDetails } = req.body;

        if (!req.user || !req.user._id) {
            throw new Error('User not authenticated');
        }

        // Validate saleId
        if (!mongoose.Types.ObjectId.isValid(saleId)) {
            throw new Error('Invalid sale ID');
        }

        // Parse the input date and ensure it includes time
        const transactionDate = date ? new Date(date) : new Date();
        if (isNaN(transactionDate.getTime())) {
            throw new Error('Invalid date provided');
        }

        // Fetch the existing sale
        const existingSale = await Sale.findById(saleId).session(session);
        if (!existingSale) {
            throw new Error('Sale not found');
        }

        // Step 1: Reverse the original sale's effects
        const originalTransactions = await Transaction.find({ saleRef: saleId }).session(session);
        for (const transaction of originalTransactions) {
            const { debitAccount, creditAccount, amount } = transaction;

            // Reverse account balances
            await Promise.all([
                Account.findByIdAndUpdate(debitAccount, { $inc: { balance: -amount } }, { session }),
                Account.findByIdAndUpdate(creditAccount, { $inc: { balance: -amount } }, { session })
            ]);

            // Delete the transaction
            await Transaction.deleteOne({ _id: transaction._id }, { session });
        }

        // Reverse stock movements
        const originalStockMovements = await StockMovement.find({ 'reference.id': saleId }).session(session);
        for (const movement of originalStockMovements) {
            await Product.findByIdAndUpdate(
                movement.product,
                { $inc: { currentStock: movement.quantity } }, // Restore stock
                { session }
            );
            await StockMovement.deleteOne({ _id: movement._id }, { session });
        }

        // Reverse livestock movements
        const originalLivestockMovements = await LivestockMovement.find({ 'reference.id': saleId }).session(session);
        for (const movement of originalLivestockMovements) {
            await Livestock.findByIdAndUpdate(
                movement.livestock,
                { $inc: { quantity: movement.quantity } }, // Restore livestock
                { session }
            );
            await LivestockMovement.deleteOne({ _id: movement._id }, { session });
        }

        // Step 2: Update the sale document
        existingSale.customer = customer || existingSale.customer;
        existingSale.items = items || existingSale.items;
        existingSale.grandTotal = grandTotal || existingSale.grandTotal;
        existingSale.paidAmount = paidAmount !== undefined ? paidAmount : existingSale.paidAmount;
        existingSale.remainingBalance = existingSale.grandTotal - (existingSale.paidAmount || 0);
        existingSale.saleNumber = saleNumber || existingSale.saleNumber;
        existingSale.date = transactionDate;
        existingSale.updatedBy = req.user._id; // Optional: track who updated it
        await existingSale.save({ session });

        // Step 3: Apply new sale effects
        // Get required accounts
        const [salesAccount, customerAccount, paymentAccount] = await Promise.all([
            Account.findOne({ accountType: 'Sale', accountName: 'Sales Account' }).session(session),
            Account.findOne({ accountType: 'Customer', _id: customer || existingSale.customer }).session(session),
            paymentDetails?.accountId ? Account.findById(paymentDetails.accountId).session(session) : null
        ]);

        if (!salesAccount || !customerAccount || (paymentType === 'payment' && !paymentAccount)) {
            throw new Error('Required accounts not found');
        }

        // Create main sale transaction
        const saleTransaction = new Transaction({
            contextDescriptions: {
                [customerAccount._id.toString()]: `Receivable from sale #${existingSale.saleNumber} to ${customerAccount.accountName}`,
                [salesAccount._id.toString()]: `Revenue from sale #${existingSale.saleNumber}`
            },
            amount: existingSale.grandTotal,
            debitAccount: customerAccount._id,
            creditAccount: salesAccount._id,
            date: transactionDate,
            createdBy: req.user._id,
            saleRef: existingSale._id
        });

        await saleTransaction.save({ session });

        // Update account balances for sale
        await Promise.all([
            Account.findByIdAndUpdate(customerAccount._id, 
                { $inc: { balance: existingSale.grandTotal } }, 
                { session }
            ),
            Account.findByIdAndUpdate(salesAccount._id, 
                { $inc: { balance: existingSale.grandTotal } }, 
                { session }
            )
        ]);

        // Handle payment if any
        if (paymentType === 'payment' && existingSale.paidAmount > 0) {
            const invoiceAdjustment = Math.min(existingSale.paidAmount, existingSale.grandTotal);

            const paymentTransaction = new Transaction({
                contextDescriptions: {
                    [paymentAccount._id.toString()]: `Cash received from ${customerAccount.accountName}`,
                    [customerAccount._id.toString()]: `Payment made to ${paymentAccount.accountName}`
                },
                amount: invoiceAdjustment,
                debitAccount: paymentAccount._id,
                creditAccount: customerAccount._id,
                date: transactionDate,
                createdBy: req.user._id,
                saleRef: existingSale._id
            });

            await paymentTransaction.save({ session });

            if (existingSale.paidAmount > existingSale.grandTotal) {
                const advanceAmount = existingSale.paidAmount - existingSale.grandTotal;
                const advanceTransaction = new Transaction({
                    contextDescriptions: {
                        [paymentAccount._id.toString()]: `Advance cash received from ${customerAccount.accountName}`,
                        [customerAccount._id.toString()]: `Advance payment made to ${paymentAccount.accountName}`
                    },
                    amount: advanceAmount,
                    debitAccount: paymentAccount._id,
                    creditAccount: customerAccount._id,
                    date: transactionDate,
                    createdBy: req.user._id,
                    saleRef: existingSale._id
                });
                await advanceTransaction.save({ session });
            }

            await Promise.all([
                Account.findByIdAndUpdate(paymentAccount._id, 
                    { $inc: { balance: existingSale.paidAmount } }, 
                    { session }
                ),
                Account.findByIdAndUpdate(customerAccount._id, 
                    { $inc: { balance: -existingSale.paidAmount } }, 
                    { session }
                )
            ]);
        }

        // Update stock for items
        await Promise.all(existingSale.items.map(async item => {
            if (item.itemType === 'Product') {
                const product = await Product.findById(item.itemId).session(session);
                if (!product) {
                    throw new Error(`Product not found: ${item.name}`);
                }

                if (product.currentStock < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}`);
                }

                await StockMovement.create([{
                    product: item.itemId,
                    date: transactionDate,
                    transactionType: 'Sale',
                    quantity: item.quantity,
                    unit: product.unit,
                    previousStock: product.currentStock,
                    currentStock: product.currentStock - item.quantity,
                    unitRate: item.rate,
                    reference: {
                        type: 'Sale',
                        id: existingSale._id
                    },
                    createdBy: req.user._id
                }], { session });

                await Product.findByIdAndUpdate(
                    item.itemId,
                    { $inc: { currentStock: -item.quantity } },
                    { session }
                );
            } else if (item.itemType === 'Livestock') {
                const livestock = await Livestock.findById(item.itemId).session(session);
                if (!livestock) {
                    throw new Error(`Livestock not found: ${item.name}`);
                }

                if (livestock.quantity < item.quantity) {
                    throw new Error(`Insufficient livestock count for ${livestock.type}`);
                }

                await LivestockMovement.create([{
                    livestock: item.itemId,
                    date: transactionDate,
                    transactionType: 'Sale',
                    quantity: item.quantity,
                    previousStock: livestock.quantity,
                    currentStock: livestock.quantity - item.quantity,
                    unitRate: item.rate || 0,
                    reference: {
                        type: 'Sale',
                        id: existingSale._id
                    },
                    createdBy: req.user._id
                }], { session });

                await Livestock.findByIdAndUpdate(
                    item.itemId,
                    { $inc: { quantity: -item.quantity } },
                    { session }
                );
            }
        }));

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            data: {
                sale: existingSale,
                message: 'Sale updated successfully'
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

// Get all invoices with pagination and filters
exports.getSales = async (req, res) => {
  try {
    let queryDate;
    if (req.params.date === 'today') {
      queryDate = new Date();
    } else {
      queryDate = new Date(req.params.date);
      if (isNaN(queryDate.getTime())) {
        throw new Error('Invalid date format');
      }
    }

    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Fetching sales between:', {
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });

    // First get sales for the day with customer data
    const sales = await Sale.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
    .populate({
      path: 'customer',
      select: 'accountName contactNo',
      match: { accountType: 'Customer' },
      model: 'Account'
    })
    .sort({ date: -1 });

    console.log('Found sales:', sales.length);

    // Get corresponding transactions for each sale
    const formattedSales = await Promise.all(sales.map(async (sale) => {
      const saleTransaction = await Transaction.findOne({ 
        saleRef: sale._id,
        description: { $regex: `Sale Invoice #${sale.saleNumber}` }
      })
      .populate('debitAccount', 'accountName')
      .populate('creditAccount', 'accountName');

      return {
        _id: sale._id,
        date: sale.date,
        saleNumber: sale.saleNumber,
        customer: {
          name: sale.customer?.accountName || 'N/A',
          contactNumber: sale.customer?.contactNo || 'N/A'
        },
        debitAccount: saleTransaction?.debitAccount,
        creditAccount: saleTransaction?.creditAccount,
        totalAmount: sale.grandTotal,
        status: sale.remainingBalance > 0 ? 'Partial' : 'Paid'
      };
    }));

    res.status(200).json({
      success: true,
      data: formattedSales
    });

  } catch (error) {
    console.error('Error in getSales:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get single invoice by ID
exports.getSalesById = async (req, res) => {
    try {
        const invoice = await Sale.findById(req.params.id)
            .populate('customer', 'customerName contactNo address')
            .populate('createdBy', 'name')
            .populate('items.itemId', 'name code');

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        res.status(200).json({
            success: true,
            data: invoice
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Update invoice payment
exports.updateSalesPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { paidAmount } = req.body;
        const invoice = await Sale.findById(req.params.id).session(session);

        if (!invoice) {
            throw new Error('Invoice not found');
        }

        // Update payment details
        const newPaidAmount = invoice.paidAmount + paidAmount;
        const newRemainingBalance = invoice.totalAmount - newPaidAmount;
        const newStatus = newRemainingBalance === 0 ? 'PAID' : 'PARTIAL';

        // Update invoice
        const updatedInvoice = await Sale.findByIdAndUpdate(
            req.params.id,
            {
                paidAmount: newPaidAmount,
                remainingBalance: newRemainingBalance,
                status: newStatus
            },
            { new: true, session }
        );

        // Update customer balance
        await Customer.findByIdAndUpdate(
            invoice.customerInfo,
            { 
                $inc: { 
                    totalPurchases: invoice.totalAmount,
                    balance: newRemainingBalance 
                }
            },
            { session }
        );

        // Update stock for each product
        for (const item of invoice.items) {
            const product = await Product.findById(item.productId).session(session);
            if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
            }

            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for product: ${product.name}`);
            }

            // Deduct stock
            await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: -item.quantity } },
                { session }
            );
        }

        // Save invoice
        await updatedInvoice.save({ session });

        // Commit the transaction
        await session.commitTransaction();

        res.status(200).json({
            success: true,
            data: updatedInvoice
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

// Delete invoice (admin only)
exports.deleteSale = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const sale = await Sale.findById(req.params.id).session(session);
        if (!sale) {
            throw new Error('Sale not found');
        }

        // Find all related transactions
        const transactions = await Transaction.find({ saleRef: sale._id }).session(session);

        // Get affected accounts
        const [salesAccount, customerAccount] = await Promise.all([
            Account.findOne({ accountType: 'Sale', accountName: 'Sales Account' }).session(session),
            Account.findById(sale.customer).session(session)
        ]);

        if (!salesAccount || !customerAccount) {
            throw new Error('Required accounts not found');
        }

        // Reverse account balances from sale transaction
        await Promise.all([
            Account.findByIdAndUpdate(
                customerAccount._id,
                { $inc: { balance: -sale.grandTotal } },
                { session }
            ),
            Account.findByIdAndUpdate(
                salesAccount._id,
                { $inc: { balance: -sale.grandTotal } },
                { session }
            )
        ]);

        // Handle payment reversal if it exists
        if (sale.paidAmount > 0) {
            const paymentTransaction = transactions.find(t => 
                t.debitAccount.toString() !== customerAccount._id.toString() &&
                t.creditAccount.toString() === customerAccount._id.toString()
            );
            
            if (paymentTransaction) {
                const paymentAccount = await Account.findById(paymentTransaction.debitAccount).session(session);
                await Promise.all([
                    Account.findByIdAndUpdate(
                        paymentAccount._id,
                        { $inc: { balance: -sale.paidAmount } },
                        { session }
                    ),
                    Account.findByIdAndUpdate(
                        customerAccount._id,
                        { $inc: { balance: sale.paidAmount } },
                        { session }
                    )
                ]);
            }
        }

        // Restore stock and remove stock movements
        await Promise.all(sale.items.map(async item => {
            if (item.itemType === 'Product') {
                await Promise.all([
                    Product.findByIdAndUpdate(
                        item.itemId,
                        { $inc: { currentStock: item.quantity } },
                        { session }
                    ),
                    StockMovement.deleteOne(
                        { 
                            product: item.itemId,
                            'reference.type': 'Sale',
                            'reference.id': sale._id 
                        },
                        { session }
                    )
                ]);
            } else if (item.itemType === 'Livestock') {
                await Promise.all([
                    Livestock.findByIdAndUpdate(
                        item.itemId,
                        { $inc: { quantity: item.quantity } },
                        { session }
                    ),
                    LivestockMovement.deleteOne(
                        { 
                            livestock: item.itemId,
                            'reference.type': 'Sale',
                            'reference.id': sale._id 
                        },
                        { session }
                    )
                ]);
            }
        }));

        // Delete all related transactions
        await Transaction.deleteMany({ saleRef: sale._id }, { session });

        // Delete the sale
        await Sale.deleteOne({ _id: sale._id }, { session });

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: 'Sale and all related records deleted successfully'
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

// Get invoices by customer
exports.getSalesByCustomer = async (req, res) => {
    try {
        const invoices = await Sale.find({ customerInfo: req.params.customerId })
            .populate('customerInfo', 'name phone')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: invoices
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.getSalesByDate = async (req, res) => {
  try {
    let queryDate;
    if (req.params.date === 'today') {
      queryDate = new Date();
    } else {
      queryDate = new Date(req.params.date);
      if (isNaN(queryDate.getTime())) {
        throw new Error('Invalid date format');
      }
    }

    // Set start of day in local timezone
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    // Set end of day in local timezone
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Fetching sales between:', {
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });

    const sales = await Sale.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
    .populate('customer', 'name contactNumber')
    .populate('debitAccount', 'accountName')
    .populate('creditAccount', 'accountName')
    .sort({ createdAt: -1 });

    console.log('Found sales:', sales.length);

    const formattedSales = sales.map(sale => ({
      _id: sale._id,
      date: sale.date,
      saleNumber: sale.saleNumber,
      customerName: sale.customer?.name || 'N/A',
      description: `Debited: ${sale.debitAccount?.accountName || 'N/A'} | Credited: ${sale.creditAccount?.accountName || 'N/A'}`,
      totalAmount: sale.grandTotal,
      status: sale.remainingBalance > 0 ? 'Partial' : 'Paid'
    }));

    res.status(200).json({
      success: true,
      data: formattedSales
    });
  } catch (error) {
    console.error('Error in getSalesByDate:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Handle additional payment for existing sale
exports.addPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { saleId, amount, paymentMethod = 'cash' } = req.body;

        const sale = await Sale.findById(saleId);
        if (!sale) {
            throw new Error('Sale not found');
        }

        if (amount > sale.remainingBalance) {
            throw new Error('Payment amount exceeds remaining balance');
        }

        // Get required accounts
        const [customerAccount, cashAccount, bankAccount] = await Promise.all([
            Account.findOne({ accountType: 'Customer', _id: sale.customer }),
            Account.findOne({ accountType: 'Cash', accountName: 'Cash in Hand' }),
            Account.findOne({ accountType: 'Bank', accountName: 'Bank Account' })
        ]);

        // Determine which account to debit based on payment method
        const debitAccount = paymentMethod === 'cash' ? cashAccount : bankAccount;

        // Create payment transaction
        const paymentTransaction = new Transaction({
            description: `Payment received for Invoice #${sale.saleNumber}`,
            amount: amount,
            debitAccount: debitAccount._id,      // Debit Cash/Bank Account
            creditAccount: customerAccount._id,   // Credit Customer Account
            date: new Date(),
            createdBy: req.user._id,
            reference: {
                type: 'Sale',
                id: sale._id
            }
        });

        // Update sale document
        sale.paidAmount += amount;
        sale.remainingBalance -= amount;

        // Save changes
        await Promise.all([
            sale.save({ session }),
            paymentTransaction.save({ session })
        ]);

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            data: {
                sale,
                transaction: paymentTransaction
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


