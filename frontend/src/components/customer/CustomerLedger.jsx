import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Divider,
  CircularProgress,
  TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const CustomerLedger = () => {
  const { customerId } = useParams();
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      let url = `/api/customers/${customerId}/ledger`;
      
      // Add date filters if they exist
      if (startDate && endDate) {
        url += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      }
      
      const response = await axios.get(url);
      setLedgerData(response.data.data);
    } catch (error) {
      console.error('Error fetching ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [customerId, startDate, endDate]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!ledgerData) {
    return <Typography color="error">Failed to load ledger data</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Customer Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {ledgerData.customerInfo.name}
          </Typography>
          <Typography color="textSecondary">
            Contact: {ledgerData.customerInfo.contactNumber}
          </Typography>
          {ledgerData.customerInfo.address && (
            <Typography color="textSecondary">
              Address: {ledgerData.customerInfo.address}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Date Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Transactions
              </Typography>
              <Typography variant="h5">
                {ledgerData.summary.totalTransactions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Payments
              </Typography>
              <Typography variant="h5">
                ₹{ledgerData.summary.totalPayments.toFixed(2)}
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
              <Typography variant="h5">
                ₹{ledgerData.summary.openingBalance.toFixed(2)}
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
              <Typography variant="h5">
                ₹{ledgerData.summary.closingBalance.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Mode Breakdown */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Payment Mode Breakdown
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography color="textSecondary">
                Cash: ₹{ledgerData.summary.paymentModes.cash.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography color="textSecondary">
                UPI: ₹{ledgerData.summary.paymentModes.upi.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography color="textSecondary">
                Bank Transfer: ₹{ledgerData.summary.paymentModes.bank_transfer.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Transaction Number</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Payment Mode</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ledgerData.transactions.map((transaction, index) => (
              <TableRow key={index}>
                <TableCell>{transaction.date}</TableCell>
                <TableCell>{transaction.transactionNumber}</TableCell>
                <TableCell>₹{transaction.amount}</TableCell>
                <TableCell>{transaction.modeOfPayment}</TableCell>
                <TableCell>{transaction.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CustomerLedger; 