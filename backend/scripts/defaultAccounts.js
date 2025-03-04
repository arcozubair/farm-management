const Account = require("../models/Account.model");

const defaultAccounts = [
  {
    accountType: "Cash",
    accountName: "Cash in Hand",
    balance: 0,
    initialBalance: 0,
    balanceMethod: "perpetual",
    note: "Default cash account"
  },
  {
    accountType: "Sale",
    accountName: "Sales Account",
    balance: 0,
    initialBalance: 0,
    balanceMethod: "transactional",
    note: "Default sales account"
  },
  {
    accountType: "Sale",
    accountName: "Sales Return Account",
    balance: 0,
    initialBalance: 0,
    balanceMethod: "transactional",
    note: "Default sales return account"
  },
  {
    accountType: "Purchase",
    accountName: "Purchase Account",
    balance: 0,
    initialBalance: 0,
    balanceMethod: "transactional",
    note: "Default purchase account"
  },
  {
    accountType: "Purchase",
    accountName: "Purchase Return Account",
    balance: 0,
    initialBalance: 0,
    balanceMethod: "transactional",
    note: "Default purchase return account"
  },
  {
    accountType: "Customer",
    accountName: "Walk-in Customer",
    customerName: "Walk-in Customer",
    email: "walkin@example.com",
    contactNo: "0000000000",
    address: "Walk-in",
    balance: 0,
    initialBalance: 0,
    balanceMethod: "perpetual",
    note: "Default walk-in customer account"
  },
  {
    accountType: "Supplier",
    accountName: "Walk-in Supplier",
    supplierName: "Walk-in Supplier",
    email: "walkinsupplier@example.com",
    contactNo: "0000000000",
    address: "Walk-in",
    balance: 0,
    initialBalance: 0,
    balanceMethod: "perpetual",
    note: "Default walk-in supplier account"
  },
  {
    accountType: "Expense",
    accountName: "Salary Expense",
    balance: 0,
    initialBalance: 0,
    balanceMethod: "transactional",
    note: "Default salary expense account"
  },
  {
    accountType: "Liability",
    accountName: "Outstanding Expenses",
    balance: 0,
    initialBalance: 0,
    balanceMethod: "transactional",
    note: "Tracks unpaid expenses"
  }
];

const seedDefaultAccounts = async () => {
  try {
    // Check if accounts already exist
    const existingAccounts = await Account.find({
      accountName: { $in: defaultAccounts.map(account => account.accountName) }
    });

    if (existingAccounts.length === 0) {
      // Insert default accounts
      await Account.insertMany(defaultAccounts);
      console.log('Default accounts created successfully');
    } else {
      console.log('Default accounts already exist');
    }
  } catch (error) {
    console.error('Error seeding default accounts:', error);
  }
};

module.exports = seedDefaultAccounts;