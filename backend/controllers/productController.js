const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const mongoose = require('mongoose');
const { capitalizeFirstLetter } = require('../utils/formatters');

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.createProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, unit, currentStock, price, description } = req.body;

    const product = await Product.create([{
      name: capitalizeFirstLetter(name),
      unit,
      currentStock: currentStock || 0,
      price,
      description
    }], { session });

    // Create initial stock movement if there's initial stock
    if (currentStock > 0) {
      await StockMovement.create([{
        product: product[0]._id,
        date: new Date(),
        transactionType: 'Initial',
        quantity: currentStock,
        unit,
        previousStock: 0,
        currentStock,
        unitPrice: price,
        reference: {
          type: 'Adjustment',
          id: product[0]._id
        },
        createdBy: req.user._id
      }], { session });
    }

    await session.commitTransaction();
    res.status(201).json({
      success: true,
      data: product[0]
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({
      success: false,
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.updateStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, quantity, transactionType, shift, date } = req.body;
    
    const product = await Product.findById(productId).session(session);
    if (!product) {
      throw new Error('Product not found');
    }

    const previousStock = product.currentStock;
    let newStock = previousStock;

    // Handle different transaction types
    switch (transactionType.toLowerCase()) {
      case 'purchase':
        newStock += Number(quantity);
        break;
      case 'sale':
        if (previousStock < quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }
        newStock -= Number(quantity);
        break;
      case 'collection':
        newStock += Number(quantity);
        break;
      case 'adjustment':
        newStock = Number(quantity); // Direct stock adjustment
        break;
      default:
        throw new Error(`Invalid transaction type: ${transactionType}`);
    }

    // Create stock movement record
    await StockMovement.create([{
      product: productId,
      date: date ? new Date(date) : new Date(),
      transactionType: transactionType.charAt(0).toUpperCase() + transactionType.slice(1),
      quantity: Number(quantity),
      unit: product.unit,
      previousStock,
      currentStock: newStock,
      unitPrice: product.price,
      createdBy: req.user._id,
      reference: {
        type: transactionType.charAt(0).toUpperCase() + transactionType.slice(1),
        id: product._id
      },
      notes: shift ? `Shift: ${shift}` : undefined
    }], { session });

    // Update product stock
    product.currentStock = newStock;
    await product.save({ session });

    await session.commitTransaction();
    res.json({
      success: true,
      data: product
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

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
};

exports.addProductStock = async (req, res) => {
  try {
    const { type, quantity } = req.body;
    
    const product = await Product.findOne({ type });
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product type not found'
      });
    }

    product.quantity += quantity;
    await product.save();

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.getProductDetails = async (req, res) => {
  try {
    const date = new Date(req.query.date);
    date.setHours(0, 0, 0, 0); // Start of the day

    console.log('Fetching collections for date:', date);

    // Aggregate collections for the specified date
    const result = await DayBook.aggregate([
      {
        $match: {
          createdAt: {
            $gte: date, // Start of the day
            $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000) // End of the day
          }
        }
      },
      {
        $unwind: "$collections" // Decompose the collections array into individual documents
      },
      {
        $group: {
          _id: "$collections.type", // Group by collection type
          totalQuantity: { $sum: { $toDouble: "$collections.quantity" } } // Sum quantities by type
        }
      }
    ]);

    console.log('Aggregation result:', result);

    // Initialize collections
    let milkCollection = 0;
    let eggsCollection = 0;

    // Map results to specific collection types
    result.forEach(item => {
      if (item._id === 'milk') {
        milkCollection = item.totalQuantity;
      } else if (item._id === 'eggs') {
        eggsCollection = item.totalQuantity;
      }
    });

    console.log('Calculated collections:', { milkCollection, eggsCollection });

    res.json({
      success: true,
      data: {
        milkCollection,
        eggsCollection,
        date: date.toISOString()
      }
    });
  } catch (error) {
    console.error('Error in getProductDetails:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getDailyStockReport = async (req, res) => {
  try {
    const { date } = req.query;
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const dailyReport = await StockMovement.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: '$product',
          totalSales: {
            $sum: {
              $cond: [
                { $eq: ['$transactionType', 'Sale'] },
                '$quantity',
                0
              ]
            }
          },
          totalPurchases: {
            $sum: {
              $cond: [
                { $eq: ['$transactionType', 'Purchase'] },
                '$quantity',
                0
              ]
            }
          },
          totalCollections: {
            $sum: {
              $cond: [
                { $eq: ['$transactionType', 'Collection'] },
                '$quantity',
                0
              ]
            }
          },
          openingStock: {
            $first: '$previousStock'
          },
          closingStock: {
            $last: '$currentStock'
          }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          _id: 1,
          productId: '$_id',
          productName: '$product.name',
          unit: '$product.unit',
          totalSales: 1,
          totalPurchases: 1,
          totalCollections: 1,
          openingStock: 1,
          closingStock: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: dailyReport
    });
  } catch (error) {
    console.error('Error getting daily stock report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily stock report'
    });
  }
};

exports.updatePrice = async (req, res) => {
  try {
    const { id, price } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      id,
      { price },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error updating price:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update price'
    });
  }
};

exports.getProductMovements = async (req, res) => {
  try {
    const { productId } = req.params;
    const movements = await StockMovement.find({ product: productId })
      .sort({ date: -1 })
      .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      data: movements
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
