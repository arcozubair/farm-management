const CompanySettings = require('../models/CompanySettings');

exports.updateSettings = async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = new CompanySettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await CompanySettings.findOne();
    res.json({ success: true, data: settings || {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}; 