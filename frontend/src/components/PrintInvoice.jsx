import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
  IconButton,
  DialogTitle,
  CircularProgress
} from '@mui/material';
import { Close as CloseIcon, Print as PrintIcon } from '@mui/icons-material';
import { getCompanySettings } from '../services/companySettingsService';

const PrintInvoice = ({ open, onClose, invoiceData }) => {
  const [companyDetails, setCompanyDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const response = await getCompanySettings();
        setCompanyDetails(response.data);
      } catch (error) {
        console.error('Error fetching company details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchCompanyDetails();
    }
  }, [open]);

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-print-content');
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  if (!invoiceData || loading) return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      </DialogContent>
    </Dialog>
  );

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

  const formatAddress = (address) => {
    if (!address) return '';
    const {line1, line2, city, state, pincode} = address;
    return [
      line1,
      line2,
      `${city}, ${state} - ${pincode}`
    ].filter(Boolean).join(', ');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Invoice Preview</Typography>
        <Box>
          <IconButton onClick={handlePrint} color="primary">
            <PrintIcon />
          </IconButton>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box id="invoice-print-content" sx={{ p: 2 }}>
          <Paper elevation={0} sx={{ p: 2 }}>
            {/* Header */}
            <Box textAlign="center" mb={3}>
              <Typography variant="h5" gutterBottom>
                TAX INVOICE
              </Typography>
              <Typography variant="h6" gutterBottom>
                {companyDetails?.companyName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {formatAddress(companyDetails?.address)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Contact: {companyDetails?.phoneNumber}
              </Typography>
              {companyDetails?.gstNumber && (
                <Typography variant="body2" color="textSecondary">
                  GSTIN: {companyDetails.gstNumber}
                </Typography>
              )}
            </Box>

            {/* Invoice Details */}
            <Box mb={3}>
              <Box display="flex" justifyContent="space-between">
                <Box>
                  <Typography variant="body2">
                    <strong>Invoice No:</strong> {invoiceData.invoiceNumber}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Date:</strong> {formatDate(invoiceData.createdAt)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2">
                    <strong>Customer Name:</strong> {invoiceData.customer?.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Contact:</strong> {invoiceData.customer?.contactNumber || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Items Table */}
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Sr.</TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoiceData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="right">
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell align="right">₹{item.rate?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell align="right">
                      ₹{((item.quantity || 0) * (item.rate || 0)).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Totals */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{ width: '250px' }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Sub Total:</Typography>
                  <Typography variant="body2">₹{invoiceData.subTotal?.toFixed(2) || '0.00'}</Typography>
                </Box>
                {invoiceData.gstPercentage > 0 && (
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">GST ({invoiceData.gstPercentage}%):</Typography>
                    <Typography variant="body2">₹{invoiceData.gstAmount?.toFixed(2) || '0.00'}</Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body1"><strong>Grand Total:</strong></Typography>
                  <Typography variant="body1"><strong>₹{invoiceData.grandTotal?.toFixed(2) || '0.00'}</strong></Typography>
                </Box>
              </Box>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Thank you for your business!
              </Typography>
              {companyDetails?.termsAndConditions && (
                <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                  {companyDetails.termsAndConditions}
                </Typography>
              )}
            </Box>
          </Paper>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PrintInvoice; 