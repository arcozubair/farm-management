const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Livestock = require('../models/Livestock');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const CompanySettings = require('../models/CompanySettings');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { sendPdfToWhatsapp } = require('../utils/whatsappSender');

exports.createInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { customer, items, grandTotal } = req.body;

        // Validate input early
        if (!customer || !Array.isArray(items) || items.length === 0 || !grandTotal) {
            throw new Error('Invalid input parameters');
        }

        // Batch database queries using Promise.all
        const [customerDoc, settings, stockItems] = await Promise.all([
            Customer.findById(customer)
                .select('name contactNumber address currentBalance email whatsappNotification')
                .session(session),
            CompanySettings.findOne(),
            // Fetch all stock items in one query
            Promise.all(items.map(item => {
                const Model = item.itemType === 'Livestock' ? Livestock : Product;
                return Model.findById(item.itemId).session(session);
            }))
        ]);

        // Validation checks
        if (!customerDoc || !settings) {
            throw new Error(!customerDoc ? 'Customer not found' : 'Company settings not found');
        }

        // Validate stock availability in memory
        const stockValidation = items.map((item, index) => {
            const stockItem = stockItems[index];
            if (!stockItem) {
                throw new Error(`Item ${item.itemId} not found`);
            }

            const currentStock = item.itemType === 'Livestock' ? 
                stockItem.quantity : stockItem.currentStock;

            if (currentStock < item.quantity) {
                throw new Error(`Insufficient stock for item ${item.itemId}`);
            }
            
            return {
                Model: item.itemType === 'Livestock' ? Livestock : Product,
                itemId: item.itemId,
                newStock: currentStock - item.quantity,
                isLivestock: item.itemType === 'Livestock'
            };
        });

        // Generate invoice number first
        const invoiceNumber = await generateInvoiceNumber();

        // Create invoice
        const invoice = new Invoice({
            customer,
            invoiceNumber,
            items: items.map(item => ({
                itemId: item.itemId,
                itemType: item.itemType,
                name: item.name,
                quantity: Number(item.quantity),
                price: Number(item.price),
                total: Number(item.total),
                weight: Number(item.weight || 0),
                unit: item.unit
            })),
            grandTotal: Number(grandTotal),
            remainingBalance: customerDoc.currentBalance + Number(grandTotal)
        });

        // Update customer balance
        customerDoc.currentBalance += Number(grandTotal);

        // Save all changes within the transaction
        await Promise.all([
            ...stockValidation.map(item => {
                const updateField = item.isLivestock ? 
                    { quantity: item.newStock } : 
                    { currentStock: item.newStock };
                
                return item.Model.findByIdAndUpdate(
                    item.itemId,
                    { $set: updateField },
                    { session, new: true }
                );
            }),
            customerDoc.save({ session }),
            invoice.save({ session })
        ]);

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        // After successful transaction, handle PDF and WhatsApp
        let pdfUrl;
        try {
            pdfUrl = await generateInvoicePDF({
                ...invoice.toObject(),
                customer: customerDoc.toObject()
            }, settings);

            if (pdfUrl) {
                await Invoice.findByIdAndUpdate(invoice._id, { pdfPath: pdfUrl });
            }

            // Handle WhatsApp notification
            if (customerDoc.contactNumber && customerDoc.whatsappNotification && pdfUrl) {
                const whatsappResult = await sendPdfToWhatsapp(
                    customerDoc.contactNumber,
                    pdfUrl,
                    invoice.invoiceNumber,
                    customerDoc.name
                );

                await Invoice.findByIdAndUpdate(invoice._id, {
                    whatsappSent: whatsappResult?.success || false,
                    whatsappError: whatsappResult?.error
                });
            }
        } catch (mediaError) {
            console.error('PDF/WhatsApp processing error:', mediaError);
        }

        // Populate customer details for response
        const populatedInvoice = await Invoice.findById(invoice._id)
            .populate('customer', 'name contactNumber address email');

        res.status(201).json({
            success: true,
            data: {
                invoice: populatedInvoice,
                previousBalance: customerDoc.currentBalance - grandTotal,
                newBalance: customerDoc.currentBalance,
                pdfUrl
            },
            message: 'Invoice created successfully'
        });

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        console.error('Error in createInvoice:', error);
        
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Helper function to generate invoice number
async function generateInvoiceNumber() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    
    // Find the last invoice number for the current month
    const lastInvoice = await Invoice.findOne({
        invoiceNumber: new RegExp(`^INV-${year}/${month}-`)
    }).sort({ invoiceNumber: -1 });
    
    let sequence = '00001';
    if (lastInvoice) {
        const lastSequence = lastInvoice.invoiceNumber.split('-').pop();
        sequence = String(Number(lastSequence) + 1).padStart(5, '0');
    }
    
    return `INV-${year}/${month}-${sequence}`;
}

exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
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
exports.getInvoices = async (req, res) => {
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

        const invoices = await Invoice.find(query)
            .populate('customerInfo', 'name phone')
            .populate('createdBy', 'name')
            .skip(startIndex)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Invoice.countDocuments(query);

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
exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
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
exports.updateInvoicePayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { paidAmount } = req.body;
        const invoice = await Invoice.findById(req.params.id).session(session);

        if (!invoice) {
            throw new Error('Invoice not found');
        }

        // Update payment details
        const newPaidAmount = invoice.paidAmount + paidAmount;
        const newRemainingBalance = invoice.totalAmount - newPaidAmount;
        const newStatus = newRemainingBalance === 0 ? 'PAID' : 'PARTIAL';

        // Update invoice
        const updatedInvoice = await Invoice.findByIdAndUpdate(
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
exports.deleteInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const invoice = await Invoice.findById(req.params.id).session(session);

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
exports.getInvoicesByCustomer = async (req, res) => {
    try {
        const invoices = await Invoice.find({ customerInfo: req.params.customerId })
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

exports.getInvoicesByDate = async (req, res) => {
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

    const invoices = await Invoice.find({
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