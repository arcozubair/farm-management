import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Paper
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';

const Receipt = ({ open, onClose, transactionData }) => {
  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content');
    const originalContents = document.body.innerHTML;

    if (Array.isArray(transactionData)) {
      const receiptsHTML = transactionData.map(transaction => 
        generateReceiptHTML(transaction)
      ).join('<div style="page-break-after: always;"></div>');
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Receipts</title>
            <style>
              @media print {
                body { margin: 0; padding: 20px; }
                .receipt { margin-bottom: 20px; }
              }
            </style>
          </head>
          <body>${receiptsHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    } else {
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
    }
    window.location.reload();
  };

  const generateReceiptHTML = (transaction) => {
    return `
      <div class="receipt">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2>PAYMENT RECEIPT</h2>
          <p>Your Business Name</p>
          <p>Address Line 1, Address Line 2</p>
          <p>Contact: +91 XXXXXXXXXX</p>
        </div>
        <hr/>
        <p><strong>Date:</strong> ${formatDate(transaction.createdAt)}</p>
        <p><strong>Receipt No:</strong> ${transaction._id?.slice(-6).toUpperCase() || 'N/A'}</p>
        <p><strong>Customer Name:</strong> ${transaction.customerId?.name || 'N/A'}</p>
        <p><strong>Contact:</strong> ${transaction.customerId?.contactNumber || 'N/A'}</p>
        <hr/>
        <div style="margin: 20px 0;">
          <h3>Payment Details</h3>
          <p>Previous Balance: ₹${transaction.previousBalance?.toFixed(2) || '0.00'}</p>
          <p>Amount Paid: ₹${transaction.amountPaid?.toFixed(2) || '0.00'}</p>
          <p>Payment Mode: ${transaction.paymentMode === 'cash' ? 'Cash' : 'Account Transfer'}</p>
          <hr/>
          <p><strong>Current Balance: ₹${transaction.currentBalance?.toFixed(2) || '0.00'}</strong></p>
        </div>
        <div style="text-align: center; margin-top: 40px;">
          <p>Thank you for your business!</p>
          <small>This is a computer generated receipt</small>
        </div>
      </div>
    `;
  };

  if (!transactionData) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  console.log('Transaction Data:', transactionData);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent>
        <Box id="receipt-content" sx={{ p: 2 }}>
          {Array.isArray(transactionData) ? (
            <Typography variant="h6" gutterBottom>
              {transactionData.length} receipts selected for printing
            </Typography>
          ) : (
            <Paper elevation={0} sx={{ p: 2 }}>
              {/* Header */}
              <Box textAlign="center" mb={2}>
                <Typography variant="h5" gutterBottom>
                  PAYMENT RECEIPT
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Your Business Name
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Address Line 1, Address Line 2
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Contact: +91 XXXXXXXXXX
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Receipt Details */}
              <Box mb={2}>
                <Typography variant="body2">
                  <strong>Date:</strong> {formatDate(transactionData.createdAt)}
                </Typography>
                <Typography variant="body2">
                  <strong>Receipt No:</strong> {transactionData._id?.slice(-6).toUpperCase() || 'N/A'}
                </Typography>
              </Box>

              {/* Customer Details */}
              <Box mb={2}>
                <Typography variant="body2">
                  <strong>Customer Name:</strong> {transactionData.customerId?.name || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Contact:</strong> {transactionData.customerId?.contactNumber || 'N/A'}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Payment Details */}
              <Box mb={2}>
                <Typography variant="body1" gutterBottom>
                  <strong>Payment Details</strong>
                </Typography>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Previous Balance:</Typography>
                  <Typography variant="body2">₹ {transactionData.previousBalance?.toFixed(2) || '0.00'}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Amount Paid:</Typography>
                  <Typography variant="body2">₹ {transactionData.amountPaid?.toFixed(2) || '0.00'}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Payment Mode:</Typography>
                  <Typography variant="body2">
                    {transactionData.paymentMode === 'cash' ? 'Cash' : 'Account Transfer'}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2"><strong>Current Balance:</strong></Typography>
                  <Typography variant="body2"><strong>₹ {transactionData.currentBalance?.toFixed(2) || '0.00'}</strong></Typography>
                </Box>
              </Box>

              {/* Footer */}
              <Box textAlign="center" mt={4}>
                <Typography variant="body2" color="textSecondary">
                  Thank you for your business!
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  This is a computer generated receipt
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button 
          onClick={handlePrint} 
          variant="contained" 
          startIcon={<PrintIcon />}
        >
          Print {Array.isArray(transactionData) ? 'All Receipts' : 'Receipt'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Receipt; 