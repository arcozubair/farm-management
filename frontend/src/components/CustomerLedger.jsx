import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  TextField,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import CloseIcon from '@mui/icons-material/Close';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PaymentsIcon from '@mui/icons-material/Payments';
import customerService from '../services/customerService';
import { formatCurrency, formatDate } from '../utils/formatters';

const CustomerLedger = ({ open, onClose, customer }) => {
  const [loading, setLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [error, setError] = useState('');

  const fetchLedger = async () => {
    if (!customer?._id || !startDate || !endDate) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await customerService.getCustomerLedger(customer._id, {
        startDate,
        endDate
      });
      
      if (response.success) {
        setLedgerData(response.data);
      } else {
        setError(response.message || 'Failed to fetch ledger data');
      }
    } catch (error) {
      setError(error.message || 'Failed to fetch ledger data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchLedger();
    }
  }, [startDate, endDate, customer]);

  const handleDateSubmit = () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }
    if (startDate > endDate) {
      setError('Start date cannot be after end date');
      return;
    }
    fetchLedger();
  };

  // Helper function to ensure valid dates
  const ensureValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) ? date : null;
  };

  // Calculate totals by payment mode
  const calculatePaymentModeTotals = (transactions) => {
    return transactions?.reduce((acc, trans) => ({
      cash: acc.cash + (trans.modeOfPayment === 'cash' ? trans.amount : 0),
      account_transfer: acc.account_transfer + (trans.modeOfPayment === 'account_transfer' ? trans.amount : 0)
    }), { cash: 0, account_transfer: 0 }) || { cash: 0, account_transfer: 0 };
  };

  const paymentTotals = calculatePaymentModeTotals(ledgerData?.transactions);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { minHeight: '80vh' } }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Customer Ledger - {customer?.name}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Date Selection */}
        <Box mb={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button 
                variant="contained" 
                onClick={handleDateSubmit}
                disabled={!startDate || !endDate}
                fullWidth
              >
                View Ledger
              </Button>
            </Grid>
          </Grid>
          {error && (
            <Typography color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : ledgerData ? (
          <>
            {/* Customer Info Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Customer Details
                    </Typography>
                    <Typography><strong>Name:</strong> {ledgerData.customerInfo.name}</Typography>
                    <Typography><strong>Contact:</strong> {ledgerData.customerInfo.contactNumber}</Typography>
                    <Typography><strong>Address:</strong> {ledgerData.customerInfo.address}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={4}>
                        <Box textAlign="center">
                          <AccountBalanceIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="subtitle2">Opening Balance</Typography>
                          <Typography variant="h6">₹{ledgerData.summary.openingBalance}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box textAlign="center">
                          <PaymentsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="subtitle2">Total Transactions</Typography>
                          <Typography variant="h6">{ledgerData.summary.totalTransactions}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box textAlign="center">
                          <ReceiptIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="subtitle2">Closing Balance</Typography>
                          <Typography variant="h6">₹{ledgerData.summary.closingBalance}</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Transactions Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Transaction Number</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Debit (DR)</TableCell>
                    <TableCell align="right">Credit (CR)</TableCell>
                    <TableCell align="right">Balance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Opening Balance Row */}
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>
                      {formatDate(startDate || new Date())}
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell><strong>Opening Balance</strong></TableCell>
                    <TableCell align="right">-</TableCell>
                    <TableCell align="right">-</TableCell>
                    <TableCell align="right">
                      <strong>{formatCurrency(ledgerData?.customerInfo?.openingBalance)}</strong>
                    </TableCell>
                  </TableRow>

                  {ledgerData?.transactions
                    .sort((a, b) => ensureValidDate(a.date) - ensureValidDate(b.date))
                    .map((transaction, index, array) => {
                      // Calculate running balance
                      const previousTransactions = array.slice(0, index);
                      const totalPreviousAmount = previousTransactions.reduce(
                        (sum, t) => sum + (parseFloat(t.amount) || 0), 
                        0
                      );
                      const runningBalance = ledgerData.customerInfo.openingBalance - 
                        totalPreviousAmount - (parseFloat(transaction.amount) || 0);

                      return (
                        <TableRow key={transaction.transactionId || index}>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell>{transaction.transactionNumber}</TableCell>
                          <TableCell>
                            Payment via {transaction.modeOfPayment.replace('_', ' ')}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell align="right">-</TableCell>
                          <TableCell align="right">
                            {formatCurrency(runningBalance)}
                          </TableCell>
                        </TableRow>
                      );
                  })}

                  {/* Closing Balance Row */}
                 

                  {(!ledgerData?.transactions || ledgerData.transactions.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No transactions found for the selected date range
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Summary Cards */}
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                Payment Mode Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Cash Payments
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(paymentTotals.cash)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Account Transfers
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(paymentTotals.account_transfer)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Opening Balance
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(ledgerData?.summary?.openingBalance)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Closing Balance
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(ledgerData?.summary?.closingBalance)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerLedger; 