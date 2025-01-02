const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Livestock = require('../models/Livestock');
const Product = require('../models/Product');

exports.createInvoice = async (req, res) => {
  try {
    const { customerId, items, paymentMethod, paidAmount } = req.body;

    // Format items with proper references
    const formattedItems = await Promise.all(items.map(async (item) => {
      let itemModel;
      let itemDoc;

      // Check item type and get reference
      if (item.type === 'livestock') {
        itemModel = 'Livestock';
        itemDoc = await Livestock.findById(item.itemId);
      } else {
        itemModel = 'Product';
        itemDoc = await Product.findById(item.itemId);
      }

      if (!itemDoc) {
        throw new Error(`Item with id ${item.itemId} not found`);
      }

      // Verify stock availability
      if (itemDoc.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${itemDoc.type}`);
      }

      return {
        itemType: item.type,
        item: item.itemId,
        itemModel,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice
      };
    }));

    // Generate invoice number
    const invoiceNumber = await Invoice.generateInvoiceNumber();

    // Create invoice
    const invoice = await Invoice.create({
      invoiceNumber,
      customer: customerId,
      items: formattedItems,
      paymentMethod,
      paidAmount: paidAmount || 0,
      createdBy: req.user._id,
      dueDate: req.body.dueDate,
      notes: req.body.notes
    });

    // Update inventory
    await invoice.updateInventory();

    // Update customer
    const customer = await Customer.findById(customerId);
    await customer.addInvoice(invoice._id);
    await customer.updateBalance(invoice.balance);
    await customer.updatePurchaseStats(invoice.totalAmount);

    // Populate references for response
    await invoice.populate([
      { path: 'customer', select: 'name contactNumber' },
      { path: 'items.item' },
      { path: 'createdBy', select: 'name' }
    ]);

    res.status(201).json({
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