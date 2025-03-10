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
  MenuItem,
  InputAdornment
} from '@mui/material';
import { useSnackbar } from 'notistack';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SearchIcon from '@mui/icons-material/Search';
import customerService from '../services/customerService';
import CustomerLedger from '../components/CustomerLedger';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { useNavigate } from 'react-router-dom';
import CreateInvoiceDialog from '../components/deCreateInvoiceDialog';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import useResponsiveness from '../hooks/useResponsive';

const Customers = () => {
  const { isMobile, isTablet } = useResponsiveness();
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
  const [searchQuery, setSearchQuery] = useState('');
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const navigate = useNavigate();

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
      // For new customers, calculate the initial current balance
      if (!selectedCustomer) {
        const currentBalance = formData.balanceType === 'credit' 
          ? Number(formData.openingBalance) 
          : -Number(formData.openingBalance);

        const customerData = {
          ...formData,
          currentBalance,
          openingBalance: currentBalance
        };
        
        const response = await customerService.addCustomer(customerData);
        if (response.success) {
          enqueueSnackbar('Customer added successfully', { variant: 'success' });
          handleClose();
          fetchCustomers();
        }
      } else {
        // For existing customers, only send modified fields
        const updatedFields = {};
        Object.keys(formData).forEach(key => {
          if (formData[key] !== selectedCustomer[key]) {
            updatedFields[key] = formData[key];
          }
        });

        // Only update balance if opening balance or type changed
        if (updatedFields.openingBalance !== undefined || updatedFields.balanceType !== undefined) {
          const newBalance = formData.balanceType === 'credit' 
            ? Number(formData.openingBalance) 
            : -Number(formData.openingBalance);
          
          // Calculate the difference from the current balance
          const balanceDifference = newBalance - selectedCustomer.currentBalance;
          updatedFields.currentBalance = selectedCustomer.currentBalance + balanceDifference;
        }

        const response = await customerService.updateCustomer(selectedCustomer._id, updatedFields);
        if (response.success) {
          enqueueSnackbar('Customer updated successfully', { variant: 'success' });
          handleClose();
          fetchCustomers();
        }
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
      openingBalance: Math.abs(customer.currentBalance), // Show current balance instead
      balanceType: customer.currentBalance >= 0 ? 'credit' : 'debit', // Determine type from current balance
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

  // Filter customers based on search query
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.contactNumber.includes(searchQuery) ||
    customer.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateInvoice = (customer) => {
    event.preventDefault();
    event.stopPropagation();
    
    setSelectedCustomer(customer);
    setInvoiceDialogOpen(true);
  };

  const handleCloseInvoiceDialog = () => {
    setInvoiceDialogOpen(false);
    setSelectedCustomer(null);
  };

  const actions = [
    {
      icon: <EditIcon />,
      name: 'Edit',
      handler: handleEdit,
      color: 'primary'
    },
    {
      icon: <AccountBalanceIcon />,
      name: 'View Ledger',
      handler: handleViewLedger,
      color: 'info'
    },
    {
      icon: <ReceiptIcon />,
      name: 'Create Invoice',
      handler: handleCreateInvoice,
      color: 'success'
    }
  ];

  const columns = [
    { 
      field: 'name', 
      headerName: 'Name',
      flex: 1,
      minWidth: 130
    },
    { 
      field: 'contactNumber', 
      headerName: 'Contact',
      flex: 1,
      minWidth: 120
    },
    { 
      field: 'address', 
      headerName: 'Address',
      flex: 1.5,
      minWidth: 150,
      hide: isMobile
    },
    {
      field: 'whatsappNotification',
      headerName: 'WhatsApp',
      flex: 0.8,
      minWidth: 100,
      hide: isMobile || isTablet,
      renderCell: (params) => (
        <Typography 
          sx={{ 
            color: params.value ? 'success.main' : 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          {params.value ? <WhatsAppIcon fontSize="small" /> : null}
          {params.value ? 'Enabled' : 'Disabled'}
        </Typography>
      )
    },
    {
      field: 'currentBalance',
      headerName: 'Balance',
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <Typography sx={{ 
          color: params.value >= 0 ? 'success.main' : 'error.main',
          fontWeight: 500
        }}>
          ₹{params.value.toFixed(2)}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {actions.map((action) => (
            <IconButton
              key={action.name}
              color={action.color}
              onClick={() => action.handler(params.row)}
              title={action.name}
              size="small"
            >
              {action.icon}
            </IconButton>
          ))}
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ 
      p: isMobile ? 1 : 2,
      backgroundColor: '#f5f5f7' 
    }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Grid 
            container 
            alignItems="center" 
            spacing={2}
          >
            <Grid item xs={12} md={4}>
              <Typography 
                variant={isMobile ? "h5" : "h4"}
                sx={{ fontWeight: 600, color: 'primary.main' }}
              >
                Customers
              </Typography>
            </Grid>
            <Grid item xs={isMobile ? 10 : 12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '12px' }
                }}
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={isMobile ? 2 : 12} md={2}>

            <Button
          variant="contained"
          startIcon={!isMobile && <AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ 
            width: { xs: '40px', sm: 'auto' },
            minWidth: { xs: '40px', sm: '100px' },
            height: { xs: '40px',},
            borderRadius: isMobile ? '50%' : '8px',
            p: isMobile ? 0 : 2
          }}
        >
          {isMobile ? <AddIcon /> : 'Add Customer'}
        </Button>
              
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <DataGrid
            rows={filteredCustomers}
            columns={columns}
            getRowId={(row) => row._id}
            autoHeight
            pagination
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            sx={{
              backgroundColor: 'white',
              borderRadius: '12px',
              '& .MuiDataGrid-cell': {
                borderBottom: 'none',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f8f9fa',
                borderBottom: 'none',
              },
              '& .MuiDataGrid-row': {
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              },
              border: 'none',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          />
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
                Current Balance
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Amount"
                    value={Math.abs(formData.currentBalance)}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      currentBalance: e.target.value,
                      openingBalance: e.target.value // Keep openingBalance in sync for new customers
                    })}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={formData.balanceType}
                      label="Type"
                      onChange={(e) => {
                        const newType = e.target.value;
                        setFormData({ 
                          ...formData, 
                          balanceType: newType,
                          currentBalance: newType === 'credit' ? 
                            Math.abs(formData.currentBalance) : 
                            -Math.abs(formData.currentBalance)
                        });
                      }}
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
              <Grid container spacing={{ xs: 2, sm: 4 }} sx={{ mb: 4 }}>
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

      <CreateInvoiceDialog
        open={invoiceDialogOpen}
        onClose={handleCloseInvoiceDialog}
        customer={selectedCustomer}
      />
    </Box>
  );
};

export default Customers; 