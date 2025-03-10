const Purchase = require('../models/purchase.model');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const CompanySettings = require('../models/CompanySettings');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account.model');
const StockMovement = require('../models/StockMovement');

exports.createPurchase = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { supplier, items, paidAmount, grandTotal, purchaseNumber, date, paymentType, paymentDetails } = req.body;

        if (!req.user || !req.user._id) {
            throw new Error('User not authenticated');
        }

        // Create the purchase document
        const purchase = new Purchase({
            purchaseNumber,
            date,
            supplier,
            items,
            grandTotal,
            paidAmount: paidAmount || 0,
            remainingBalance: grandTotal - (paidAmount || 0),
            createdBy: req.user._id
        });

        await purchase.save({ session });

        // Get required accounts
        const [purchaseAccount, supplierAccount, paymentAccount] = await Promise.all([
            Account.findOne({ accountType: 'Purchase', accountName: 'Purchase Account' }),
            Account.findOne({ accountType: 'Supplier', _id: supplier }),
            Account.findById(paymentDetails?.accountId)
        ]);

        if (!purchaseAccount || !supplierAccount || (paymentType === 'payment' && !paymentAccount)) {
            throw new Error('Required accounts not found');
        }

        // Create main purchase transaction
        const purchaseTransaction = new Transaction({
            description: `Purchase #${purchaseNumber}`,
            amount: grandTotal,
            debitAccount: purchaseAccount._id,
            creditAccount: supplierAccount._id,
            date: new Date(date),
            createdBy: req.user._id,
            purchaseRef: purchase._id
        });

        await purchaseTransaction.save({ session });

        // Update account balances for purchase
        await Promise.all([
            Account.findByIdAndUpdate(purchaseAccount._id, 
                { $inc: { balance: grandTotal } }, 
                { session }
            ),
            Account.findByIdAndUpdate(supplierAccount._id, 
                { $inc: { balance: grandTotal } }, 
                { session }
            )
        ]);

        // Handle payment if any
        if (paymentType === 'payment' && paidAmount > 0) {
            // Amount to adjust against invoice
            const invoiceAdjustment = Math.min(paidAmount, grandTotal);
            
            // Create payment transaction for invoice amount
            const paymentTransaction = new Transaction({
                description: `Payment for Purchase #${purchaseNumber}`,
                amount: invoiceAdjustment,
                debitAccount: supplierAccount._id,
                creditAccount: paymentAccount._id,
                date: new Date(date),
                createdBy: req.user._id,
                purchaseRef: purchase._id
            });

            await paymentTransaction.save({ session });

            // If payment exceeds invoice amount, create advance payment transaction
            if (paidAmount > grandTotal) {
                const advanceAmount = paidAmount - grandTotal;
                const advanceTransaction = new Transaction({
                    description: `Advance Payment for Purchase #${purchaseNumber}`,
                    amount: advanceAmount,
                    debitAccount: supplierAccount._id,
                    creditAccount: paymentAccount._id,
                    date: new Date(date),
                    createdBy: req.user._id,
                    purchaseRef: purchase._id
                });

                await advanceTransaction.save({ session });
            }

            // Update account balances for payment
            await Promise.all([
                Account.findByIdAndUpdate(paymentAccount._id, 
                    { $inc: { balance: -paidAmount } }, 
                    { session }
                ),
                Account.findByIdAndUpdate(supplierAccount._id, 
                    { $inc: { balance: -paidAmount } }, 
                    { session }
                )
            ]);
        }

        // Update stock for items
        await Promise.all(items.map(async item => {
            if (item.itemType === 'Product') {
                // Create stock movement record
                await StockMovement.create([{
                    product: item.itemId,
                    date: new Date(date),
                    transactionType: 'Purchase',
                    quantity: item.quantity,
                    unit: item.unit,
                    previousStock: item.previousStock || 0,
                    currentStock: (item.previousStock || 0) + item.quantity,
                    unitRate: item.rate,
                    reference: {
                        type: 'Purchase',
                        id: purchase._id
                    },
                    createdBy: req.user._id
                }], { session });

                // Update product stock
                await Product.findByIdAndUpdate(
                    item.itemId,
                    { $inc: { currentStock: item.quantity } },
                    { session }
                );
            }
        }));

        // Update company settings
        await CompanySettings.findOneAndUpdate(
            {},
            { $inc: { 'numberSequences.lastPurchaseNumber': 1 } },
            { session }
        );

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            data: {
                purchase,
                message: 'Purchase recorded successfully'
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

// Helper function to generate purchase number
async function generatePurchaseNumber() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    
    // Find the last purchase number for the current month
    const lastPurchase = await Purchase.findOne({
        purchaseNumber: new RegExp(`^PUR-${year}/${month}-`)
    }).sort({ purchaseNumber: -1 });
    
    let sequence = '00001';
    if (lastPurchase) {
        const lastSequence = lastPurchase.purchaseNumber.split('-').pop();
        sequence = String(Number(lastSequence) + 1).padStart(5, '0');
    }
    
    return `PUR-${year}/${month}-${sequence}`;
}

exports.getPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplier', 'name contactNumber')
      .populate('items.itemId')
      .populate('createdBy', 'name');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: 'Purchase not found'
      });
    }

    res.status(200).json({
      success: true,
      data: purchase
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get all purchases with pagination and filters
exports.getPurchases = async (req, res) => {
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

    const purchases = await Purchase.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    })
    .populate('supplier', 'name')
    .populate('createdBy', 'name')
    .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

