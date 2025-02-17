const Sale = require('../models/Sale.model');
const Customer = require('../models/Customer');
const Livestock = require('../models/Livestock');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const CompanySettings = require('../models/CompanySettings');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { sendPdfToWhatsapp } = require('../utils/whatsappSender');

exports.createSale = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const invoicesData = Array.isArray(req.body) ? req.body : [req.body];
        
        // Get company settings for invoice number generation
        const settings = await CompanySettings.findOne().session(session);
        if (!settings) {
            throw new Error('Company settings not found');
        }

        // Get the latest invoice number from the database
        const latestInvoice = await Sale.findOne({}, { invoiceNumber: 1 })
            .sort({ createdAt: -1 })
            .session(session);

        // Extract the sequence number from the latest invoice
        let lastSequence = 0;
        if (latestInvoice) {
            const match = latestInvoice.invoiceNumber.match(/\d+$/);
            lastSequence = match ? parseInt(match[0]) : 0;
        }

        const prefix = settings.prefixes.invoicePrefix || 'INV';
        const year = new Date().getFullYear().toString().slice(-2);
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');

        // Get all unique customer IDs
        const customerIds = [...new Set(invoicesData.map(inv => inv.customer))];
        const customers = await Customer.find({ _id: { $in: customerIds } }).session(session);
        const customerMap = new Map(customers.map(c => [c._id.toString(), c]));

        const createdInvoices = [];

        for (const invoiceData of invoicesData) {
            const { customer: customerId, items, grandTotal } = invoiceData;
            const customerDoc = customerMap.get(customerId.toString());
            
            if (!customerDoc) {
                throw new Error(`Customer not found for ID: ${customerId}`);
            }

            // Increment sequence and generate new invoice number
            lastSequence++;
            const invoiceNumber = `${prefix}-${year}/${month}-${lastSequence.toString().padStart(5, '0')}`;

            // Verify this invoice number doesn't already exist
            const existingInvoice = await Sale.findOne({ invoiceNumber }).session(session);
            if (existingInvoice) {
                throw new Error(`Invoice number ${invoiceNumber} already exists`);
            }

            const newBalance = customerDoc.currentBalance + grandTotal;

            const invoice = new Sale({
                customer: customerId,
                invoiceNumber,
                invoiceDate: invoiceData.invoiceDate || new Date(),
                items: items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total,
                    unit: item.unit,
                    itemType: item.itemType,
                    itemId: item.itemId
                })),
                grandTotal,
                paidAmount: 0,
                remainingBalance: newBalance,
                createdBy: req.user._id,
                whatsappSent: false
            });

            await invoice.save({ session });
            createdInvoices.push(invoice);

            // Update customer balance
            customerDoc.currentBalance = newBalance;
            await customerDoc.save({ session });
        }

        // Update company settings with new sequence
        settings.numberSequences.lastInvoiceNumber = lastSequence;
        await settings.save({ session });

        await session.commitTransaction();
        
        res.status(201).json({
            success: true,
            data: createdInvoices
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error in createInvoice:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        session.endSession();
    }
};

// Helper function to generate invoice number
async function generateInvoiceNumber() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    
    // Find the last invoice number for the current month
    const lastInvoice = await Sale.findOne({
        invoiceNumber: new RegExp(`^INV-${year}/${month}-`)
    }).sort({ invoiceNumber: -1 });
    
    let sequence = '00001';
    if (lastInvoice) {
        const lastSequence = lastInvoice.invoiceNumber.split('-').pop();
        sequence = String(Number(lastSequence) + 1).padStart(5, '0');
    }
    
    return `INV-${year}/${month}-${sequence}`;
}

exports.getSale = async (req, res) => {
  try {
    const invoice = await Sale.findById(req.params.id)
      .populate('customer', 'name contactNumber')
      .populate('items.item')
      .populate('createdBy', 'name');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get all invoices with pagination and filters
exports.getSales = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        let query = {};

        // Add filters if provided
        if (req.query.status) {
            query.status = req.query.status;
        }
        if (req.query.startDate && req.query.endDate) {
            query.createdAt = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        const invoices = await Sale.find(query)
            .populate('customerInfo', 'name phone')
            .populate('createdBy', 'name')
            .skip(startIndex)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Sale.countDocuments(query);

        res.status(200).json({
            success: true,
            data: invoices,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
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
            .populate('customerInfo', 'name phone address')
            .populate('createdBy', 'name')
            .populate('items.productId', 'name code');

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
        const invoice = await Sale.findById(req.params.id).session(session);

        if (!invoice) {
            throw new Error('Invoice not found');
        }

        // Restore stock for each product
        for (const item of invoice.items) {
            await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: item.quantity } },
                { session }
            );
        }

        // Delete invoice
        await invoice.deleteOne({ session });

        // Update customer balance
        await Customer.findByIdAndUpdate(
            invoice.customerInfo,
            { 
                $inc: { 
                    totalPurchases: -invoice.totalAmount,
                    balance: -invoice.remainingBalance 
                }
            },
            { session }
        );

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: 'Invoice deleted successfully'
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
    // Parse the input date and set to start of day in local timezone
    const date = new Date(req.params.date);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    // Set end of day in local timezone
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Fetching invoices between:', {
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });

    const invoices = await Sale.find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).populate('customer', 'name contactNumber');

    console.log('Found invoices:', invoices.length);

    res.status(200).json({
      success: true,
      data: invoices
    });
  } catch (error) {
    console.error('Error in getInvoicesByDate:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

