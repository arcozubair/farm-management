import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Typography,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useSnackbar } from 'notistack';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import customerService from '../services/customerService';
import CustomerLedger from '../components/CustomerLedger';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const Customers = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    address: '',
    whatsappNotification: false,
    openingBalance: 0,
    balanceType: 'credit',
    currentBalance: 0
  });
  const [openLedger, setOpenLedger] = useState(false);
  const [ledgerData, setLedgerData] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerService.getCustomers();
      if (response.success) {
        setCustomers(response.data);
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to fetch customers', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

 const fetchLedger = async (customerId, startDate, endDate) => {
    try {
    

      const response = await CustomerService.getCustomerLedger(
        customerId, 
        startDate?.toISOString(), 
        endDate?.toISOString()
      );
      
      if (response.success) {
        setLedgerData(response.data);
      } else {
        toast.error('Failed to fetch ledger data');
      }
    } catch (error) {
      console.error('Error fetching ledger:', error);
      toast.error('Error loading ledger data');
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchLedger(selectedCustomerId);
    }
  }, [selectedCustomerId, startDate, endDate]);

  const handleClose = () => {
    setOpenDialog(false);
    setSelectedCustomer(null);
    setFormData({
      name: '',
      contactNumber: '',
      address: '',
      whatsappNotification: false,
      openingBalance: 0,
      balanceType: 'credit',
      currentBalance: 0
    });
  };

  const handleSubmit = async () => {
    try {
      const currentBalance = formData.balanceType === 'credit' 
        ? Number(formData.openingBalance) 
        : -Number(formData.openingBalance);

      const customerData = {
        ...formData,
        currentBalance,
        openingBalance: currentBalance
      };

      const response = selectedCustomer
        ? await customerService.updateCustomer(selectedCustomer._id, customerData)
        : await customerService.addCustomer(customerData);

      if (response.success) {
        enqueueSnackbar(
          `Customer ${selectedCustomer ? 'updated' : 'added'} successfully`,
          { variant: 'success' }
        );
        handleClose();
        fetchCustomers();
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to save customer', { variant: 'error' });
    }
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      contactNumber: customer.contactNumber,
      address: customer.address,
      whatsappNotification: customer.whatsappNotification || false,
      openingBalance: customer.openingBalance || 0,
      balanceType: customer.balanceType || 'credit',
      currentBalance: customer.currentBalance || 0
    });
    setOpenDialog(true);
  };

  const handleViewLedger = (customer) => {
    setSelectedCustomerForLedger(customer);
    setOpenLedger(true);
  };

  const handleCustomerSelect = (customerId) => {
    setSelectedCustomerId(customerId);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '-';
      date.setHours(0, 0, 0, 0);
      return date.toLocaleDateString('en-IN');
    } catch (error) {
      console.error('Date formatting error:', error);
      return '-';
    }
  };

  return (
    <Box sx={{ p: 4, backgroundColor: '#f5f5f7' }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sx={{ mb: 3 }}>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent'
                }}
              >
                Customers
              </Typography>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                onClick={() => setOpenDialog(true)}
                sx={{
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  borderRadius: '8px',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                  color: 'white',
                  padding: '8px 24px',
                }}
              >
                Add Customer
              </Button>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <TableContainer 
            component={Paper} 
            sx={{ 
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Address</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>WhatsApp</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Balance</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow 
                    key={customer._id}
                    sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}
                  >
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.contactNumber}</TableCell>
                    <TableCell>{customer.address}</TableCell>
                    <TableCell>
                      {customer.whatsappNotification ? (
                        <Typography 
                          sx={{ 
                            color: 'success.main',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <WhatsAppIcon fontSize="small" /> Enabled
                        </Typography>
                      ) : (
                        <Typography color="text.secondary">Disabled</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography 
                        sx={{ 
                          color: customer.currentBalance >= 0 ? 'success.main' : 'error.main',
                          fontWeight: 500 
                        }}
                      >
                        ₹{customer.currentBalance}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        onClick={() => handleEdit(customer)}
                        sx={{ 
                          color: 'primary.main',
                          '&:hover': { backgroundColor: 'primary.light' }
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleViewLedger(customer)}
                        sx={{ 
                          color: 'secondary.main',
                          '&:hover': { backgroundColor: 'secondary.light' }
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <Dialog 
        open={openDialog} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle>
          {selectedCustomer ? 'Edit Customer' : 'Add Customer'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contact Number"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Opening Balance
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Amount"
                    value={formData.openingBalance}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      openingBalance: e.target.value 
                    })}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={formData.balanceType}
                      label="Type"
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        balanceType: e.target.value 
                      })}
                    >
                      <MenuItem value="credit">Credit</MenuItem>
                      <MenuItem value="debit">Debit</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                {formData.balanceType === 'credit' 
                  ? 'Customer owes you money' 
                  : 'You owe customer money'}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.whatsappNotification}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      whatsappNotification: e.target.checked 
                    })}
                  />
                }
                label="Enable WhatsApp Notifications"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedCustomer ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <CustomerLedger
        open={openLedger}
        onClose={() => setOpenLedger(false)}
        customer={selectedCustomerForLedger}
      />

      {selectedCustomerId && (
        <Box sx={{ mt: 4 }}>
          <Typography 
            variant="h5" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              color: 'primary.main',
              mb: 3
            }}
          >
            Transaction Ledger
          </Typography>
          
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

          {ledgerData && (
            <>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card 
                    sx={{ 
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)'
                      }
                    }}
                  >
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
                  <Card 
                    sx={{ 
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)'
                      }
                    }}
                  >
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
                  <Card 
                    sx={{ 
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)'
                      }
                    }}
                  >
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
                  <Card 
                    sx={{ 
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)'
                      }
                    }}
                  >
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
                    <TableRow>
                      <TableCell>{formatDate(ledgerData.transactions[0]?.createdAt || new Date())}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>Opening Balance</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>₹{ledgerData.openingBalance.toFixed(2)}</TableCell>
                    </TableRow>

                    {ledgerData.transactions.map((transaction) => (
                      <TableRow key={transaction._id}>
                        <TableCell>{formatDate(transaction.createdAt || transaction.date)}</TableCell>
                        <TableCell>{transaction.transactionNumber}</TableCell>
                        <TableCell>Payment via {transaction.modeOfPayment.replace('_', ' ')}</TableCell>
                        <TableCell>{`₹${transaction.amount.toFixed(2)}`}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>₹{transaction.runningBalance.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Customers; 