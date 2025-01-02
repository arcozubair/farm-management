const Livestock = require('../models/Livestock');

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

// Add new livestock
exports.addLivestock = async (req, res) => {
  try {
    const { category, type, quantity, notes } = req.body;

    // Validate type against predefined types
    const validTypes = Livestock.getTypes()[category];
    if (!validTypes || !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid livestock type for selected category'
      });
    }

    const livestock = await Livestock.create({
      category,
      type,
      quantity,
      notes
    });

    res.status(201).json({
      success: true,
      data: livestock
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update livestock quantity
exports.updateLivestock = async (req, res) => {
  try {
    const { quantity, notes } = req.body;
    const livestock = await Livestock.findByIdAndUpdate(
      req.params.id,
      {
        quantity,
        notes,
        lastUpdated: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!livestock) {
      return res.status(404).json({
        success: false,
        error: 'Livestock not found'
      });
    }

    res.status(200).json({
      success: true,
      data: livestock
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete livestock
exports.deleteLivestock = async (req, res) => {
  try {
    const livestock = await Livestock.findByIdAndDelete(req.params.id);

    if (!livestock) {
      return res.status(404).json({
        success: false,
        error: 'Livestock not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
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