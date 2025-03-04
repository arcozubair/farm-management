const express = require("express");
const router = express.Router();
const {
  createAccount,
  getAccount,
  updateAccount,
  getAllAccounts,
  getAccounts,
  getSalesLedger,
  getCustomerLedger,
  getCashLedger,
  getBankLedger,
  getAccountLedger,
  createPayment
} = require("../controllers/accountController");
const { protect } = require("../middleware/auth");

router.use(protect);
// Account routes
router.get("/search", getAccounts);
// router.get("/sales-ledger", getSalesLedger);
// router.get("/:accountId/customer-ledger", getCustomerLedger);
router.get('/:accountId/ledger', getAccountLedger);

router.get("/", getAllAccounts);
router.post("/", createAccount);
router.get("/:id", getAccount);
router.put("/:id", updateAccount);
router.post("/payment", createPayment);

module.exports = router; 