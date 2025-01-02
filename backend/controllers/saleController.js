const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Livestock = require('../models/Livestock');

exports.createSale = async (req, res) => {
  try {
    const { items, customer } = req.body;

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create sale
    const sale = await Sale.create({
      customer,
      items,
      totalAmount,
      createdBy: req.user._id
    });

    // Update inventory
    for (const item of items) {
      if (item.type === 'eggs' || item.type === 'milk') {
        await Product.findOneAndUpdate(
          { type: item.type },
          { $inc: { quantity: -item.quantity } }
        );
      } else {
        await Livestock.findOneAndUpdate(
          { type: item.type },
          { $inc: { quantity: -item.quantity } }
        );
      }
    }

    res.status(201).json({
      success: true,
      data: sale
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.getSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate('createdBy', 'name')
      .sort('-date');

    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.getSalesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const sales = await Sale.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).populate('createdBy', 'name');

    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    res.status(200).json({
      success: true,
      count: sales.length,
      totalSales,
      data: sales
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}; 