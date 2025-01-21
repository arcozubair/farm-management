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

exports.getNextInvoiceNumber = async (req, res) => {
    try {
        const settings = await CompanySettings.findOne();
        if (!settings) {
            throw new Error('Company settings not found');
        }

        const nextInvoiceNumber = settings.numberSequences.lastInvoiceNumber + 1;
        const prefix = settings.prefixes.invoicePrefix;
        const year = new Date().getFullYear().toString().slice(-2);
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        
        const invoiceNumber = `${prefix}-${year}/${month}-${nextInvoiceNumber.toString().padStart(5, '0')}`;

        res.status(200).json({
            success: true,
            data: {
                nextInvoiceNumber: invoiceNumber
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}; 