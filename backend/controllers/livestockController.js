const Livestock = require('../models/Livestock');

exports.getAllLivestock = async (req, res) => {
  try {
    const livestock = await Livestock.find();
    res.status(200).json({
      success: true,
      count: livestock.length,
      data: livestock
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.addLivestock = async (req, res) => {
  try {
    const livestock = await Livestock.create(req.body);
    res.status(201).json({
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

exports.updateLivestock = async (req, res) => {
  try {
    const livestock = await Livestock.findByIdAndUpdate(
      req.params.id,
      req.body,
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
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.getLivestockStats = async (req, res) => {
  try {
    const stats = await Livestock.aggregate([
      {
        $group: {
          _id: {
            type: '$type',
            gender: '$gender'
          },
          totalCount: { $sum: '$quantity' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}; 