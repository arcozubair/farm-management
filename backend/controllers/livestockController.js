const Livestock = require('../models/Livestock');
const LivestockMovement = require('../models/LivestockMovement');
const mongoose = require('mongoose');

// Get all livestock
exports.getAllLivestock = async (req, res) => {
  try {
    const livestock = await Livestock.find();
    res.status(200).json({
      success: true,
      data: livestock
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Add new livestock with initial stock movement
exports.addLivestock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { category, type, quantity, price, notes } = req.body;

    // Validate type against predefined types
    const validTypes = Livestock.getTypes()[category];
    if (!validTypes || !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid livestock type for selected category'
      });
    }

    // Create livestock
    const livestock = await Livestock.create([{
      category,
      type,
      quantity,
      price,
      notes
    }], { session });

    // Create initial stock movement
    await LivestockMovement.create([{
      livestock: livestock[0]._id,
      date: new Date(),
      transactionType: 'Initial',
      quantity,
      previousStock: 0,
      currentStock: quantity,
      reference: {
        type: 'Purchase'
      },
      createdBy: req.user._id
    }], { session });

    await session.commitTransaction();
    res.status(201).json({
      success: true,
      data: livestock[0]
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Update livestock quantity
exports.updateLivestock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { quantity, notes, transactionType } = req.body;
    const livestock = await Livestock.findById(req.params.id).session(session);

    if (!livestock) {
      return res.status(404).json({
        success: false,
        error: 'Livestock not found'
      });
    }

    const previousStock = livestock.quantity;
    let newStock = previousStock;

    // Calculate new stock based on transaction type
    switch (transactionType) {
      case 'purchase':
        newStock += Number(quantity);
        break;
      case 'sale':
        if (previousStock < quantity) {
          throw new Error(`Insufficient stock for ${livestock.type}`);
        }
        newStock -= Number(quantity);
        break;
      case 'death':
        if (previousStock < quantity) {
          throw new Error(`Insufficient stock for ${livestock.type}`);
        }
        newStock -= Number(quantity);
        break;
      case 'birth':
        newStock += Number(quantity);
        break;
      default:
        throw new Error('Invalid transaction type');
    }

    // Create stock movement record
    await LivestockMovement.create([{
      livestock: livestock._id,
      date: new Date(),
      transactionType,
      quantity,
      previousStock,
      currentStock: newStock,
      createdBy: req.user._id
    }], { session });

    // Update livestock quantity and notes
    livestock.quantity = newStock;
    if (notes) livestock.notes = notes;

    await livestock.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      data: livestock
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

// Get livestock movements history
exports.getLivestockMovements = async (req, res) => {
  try {
    const { livestockId } = req.params;
    const movements = await LivestockMovement.find({ livestock: livestockId })
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

// Delete livestock
exports.deleteLivestock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const livestock = await Livestock.findById(req.params.id).session(session);

    if (!livestock) {
      return res.status(404).json({
        success: false,
        error: 'Livestock not found'
      });
    }

    // Delete associated movements
    await LivestockMovement.deleteMany({ livestock: livestock._id }, { session });
    
    // Delete livestock
    await livestock.deleteOne({ session });

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  } finally {
    session.endSession();
  }
};

// Get livestock stats
exports.getLivestockStats = async (req, res) => {
  try {
    const stats = await Livestock.aggregate([
      {
        $group: {
          _id: {
            category: '$category',
            type: '$type'
          },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          types: {
            $push: {
              type: '$_id.type',
              quantity: '$totalQuantity'
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

exports.updatePrice = async (req, res) => {
  try {
    const { id, price } = req.body;
    const livestock = await Livestock.findByIdAndUpdate(
      id,
      { price },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      data: livestock
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}; 