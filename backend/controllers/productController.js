const Product = require('../models/Product');
const DayBook = require('../models/DayBook');

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
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
        error: 'Product not found'
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

exports.updateStock = async (req, res) => {
  try {
    const { productType, quantity, stockType, date, transactionType = 'collection' } = req.body;

    // Validate quantity
    const newQuantity = Number(quantity);
    if (newQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than zero'
      });
    }

    // Find the product
    let product = await Product.findOne({ type: productType });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const previousStock = product.currentStock;
    
    // Update stock based on transaction type
    if (transactionType === 'collection') {
      // For collections, add to current stock
      product.currentStock += newQuantity;
    } else if (transactionType === 'sale') {
      // For sales, subtract from current stock
      if (product.currentStock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock for sale'
        });
      }
      product.currentStock -= newQuantity;
    }

    // Add to stock history
    product.stockHistory.push({
      date: new Date(date),
      quantity: newQuantity,
      type: stockType,
      transactionType,
      previousStock,
      currentStock: product.currentStock
    });

    await product.save();

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product stock'
    });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { type } = req.body;

    // Check if product already exists
    let product = await Product.findOne({ type });

    if (product) {
      return res.status(400).json({
        success: false,
        message: 'Product already exists'
      });
    }

    // Create new product
    product = await Product.create({
      type,
      currentStock: 0,
      stockHistory: []
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.remove();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
};

exports.initializeProducts = async () => {
  try {
    // Check if milk product exists
    let milkProduct = await Product.findOne({ type: 'milk' });
    if (!milkProduct) {
      milkProduct = await Product.create({
        type: 'milk',
        currentStock: 0,
        stockHistory: []
      });
      console.log('Milk product initialized');
    }

    // Check if eggs product exists
    let eggsProduct = await Product.findOne({ type: 'eggs' });
    if (!eggsProduct) {
      eggsProduct = await Product.create({
        type: 'eggs',
        currentStock: 0,
        stockHistory: []
      });
      console.log('Eggs product initialized');
    }
  } catch (error) {
    console.error('Error initializing products:', error);
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

    const products = await Product.find();
    
    const dailyReport = products.map(product => {
      // Get all transactions for the day
      const dayTransactions = product.stockHistory.filter(entry => 
        entry.date >= startDate && entry.date <= endDate
      );

      // Get opening stock (first transaction of the day or previous day's closing)
      const openingStock = dayTransactions[0]?.previousStock || 0;

      // Calculate total collections and sales
      const collections = dayTransactions
        .filter(t => t.transactionType === 'collection')
        .reduce((sum, t) => sum + t.quantity, 0);

      const sales = dayTransactions
        .filter(t => t.transactionType === 'sale')
        .reduce((sum, t) => sum + t.quantity, 0);

      // Get closing stock
      const closingStock = dayTransactions[dayTransactions.length - 1]?.currentStock || openingStock;

      return {
        productType: product.type,
        openingStock,
        collections,
        sales,
        closingStock,
        transactions: dayTransactions
      };
    });

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
