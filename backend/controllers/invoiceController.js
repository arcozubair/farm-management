const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Livestock = require('../models/Livestock');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const CompanySettings = require('../models/CompanySettings');

exports.createInvoice = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { customer, items, grandTotal } = req.body;

        console.log('Starting invoice creation:', {
            customerId: customer,
            itemsCount: items.length,
            grandTotal,
            items
        });

        // Get customer's current balance first
        const customerDoc = await Customer.findById(customer).session(session);
        if (!customerDoc) {
            throw new Error('Customer not found');
        }

        const previousBalance = customerDoc.currentBalance;
        const newBalance = previousBalance + grandTotal;

        console.log('Balance calculation:', {
            previousBalance,
            invoiceAmount: grandTotal,
            newBalance
        });

        // Get company settings and generate invoice number
        const settings = await CompanySettings.findOne().session(session);
        if (!settings) {
            throw new Error('Company settings not found');
        }

        // Generate invoice number
        const nextInvoiceNumber = settings.numberSequences.lastInvoiceNumber + 1;
        const prefix = settings.prefixes.invoicePrefix;
        const year = new Date().getFullYear().toString().slice(-2);
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        
        const invoiceNumber = `${prefix}-${year}/${month}-${nextInvoiceNumber.toString().padStart(5, '0')}`;
        console.log('Generated invoice number:', invoiceNumber);

        // Update company settings with new invoice number
        await CompanySettings.findOneAndUpdate(
            {},
            { 'numberSequences.lastInvoiceNumber': nextInvoiceNumber },
            { session }
        );

        // Process each item to include name and unit
        const processedItems = await Promise.all(items.map(async (item) => {
            let itemDoc;
            if (item.itemType === 'Product') {
                itemDoc = await Product.findById(item.itemId);
            } else if (item.itemType === 'Livestock') {
                itemDoc = await Livestock.findById(item.itemId);
            }

            return {
                ...item,
                name: item.name || itemDoc?.name || 'Unknown Item',
                
            };
        }));

        // Create invoice
        const invoice = new Invoice({
            customer,
            invoiceNumber,
            items: processedItems,
            grandTotal,
            remainingBalance: newBalance,    // Set remaining balance to new total balance
            createdBy: req.user._id
        });

        await invoice.save({ session });
        console.log('Invoice created:', invoice._id);

        // Update customer balance and add invoice reference
        await Customer.findByIdAndUpdate(
            customer,
            { 
                $push: { 
                    invoices: {
                        invoiceId: invoice._id,
                        date: new Date()
                    }
                },
                currentBalance: newBalance  // Set the new total balance
            },
            { session, new: true }
        );

        console.log('Customer balance updated:', {
            customerId: customer,
            newBalance
        });

        // Update stock based on item type
        console.log('Starting stock updates...');
        
        for (const item of items) {
            const Model = item.itemType === 'Livestock' ? Livestock : Product;
            const itemId = item.itemId;

            console.log(`Processing ${item.itemType} item:`, {
                itemId,
                quantity: item.quantity,
                type: item.itemType
            });

            // First check if item exists
            const existingItem = await Model.findById(itemId).session(session);
            if (!existingItem) {
                throw new Error(`Item not found with ID: ${itemId}`);
            }

            // Get the correct stock field based on the model
            const currentStock = item.itemType === 'Livestock' ? 
                existingItem.quantity :      // For Livestock model
                existingItem.currentStock;   // For Product model

            console.log('Stock check:', {
                itemId,
                type: item.itemType,
                currentStock,
                requestedQuantity: item.quantity,
                name: existingItem.name || existingItem.type,
                fullItem: existingItem
            });
            
            // Then check if there's enough stock
            if (typeof currentStock === 'undefined' || currentStock < item.quantity) {
                throw new Error(`Insufficient stock for item ${existingItem.name || existingItem.type}. Available: ${currentStock}, Requested: ${item.quantity}`);
            }

            // Update the correct field based on model type
            const updateField = item.itemType === 'Livestock' ? 
                { quantity: currentStock - item.quantity } :    // For Livestock
                { currentStock: currentStock - item.quantity }; // For Product

            console.log('Updating stock with:', {
                itemId,
                type: item.itemType,
                updateField
            });

            // If both checks pass, update the stock
            const updatedItem = await Model.findByIdAndUpdate(
                itemId,
                { $set: updateField },
                { session, new: true }
            );

            if (!updatedItem) {
                throw new Error(`Failed to update stock for item ${itemId}`);
            }

            const newStock = item.itemType === 'Livestock' ? 
                updatedItem.quantity :
                updatedItem.currentStock;

            console.log('Stock updated successfully:', {
                itemId,
                type: item.itemType,
                previousStock: currentStock,
                deductedQuantity: item.quantity,
                newStock,
                fullUpdatedItem: updatedItem
            });
        }

        console.log('All stock updates completed successfully');

        await session.commitTransaction();
        console.log('Transaction committed successfully');
        
        res.status(201).json({
            success: true,
            data: {
                invoice,
                previousBalance,
                newBalance
            },
            message: 'Invoice created successfully'
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Error in createInvoice:', error);
        
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create invoice'
        });
    } finally {
        session.endSession();
    }
};

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
    const date = new Date(req.params.date);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const invoices = await Invoice.find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).populate('customer', 'name');

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