import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Tabs,
  Tab,
  Autocomplete,
  IconButton,
  CircularProgress
} from '@mui/material';
import { useSnackbar } from 'notistack';
import dayBookService from '../services/dayBookService';
import customerService from '../services/customerService';
import Receipt from '../components/Receipt';
import { Print as PrintIcon, Search as SearchIcon } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import AddSaleDialog from '../components/AddSaleDialog';
import AddIcon from '@mui/icons-material/Add';
import ReceiptIcon from '@mui/icons-material/Receipt';

const determineShift = () => {
  const currentHour = new Date().getHours();
  // Morning shift: 1 AM to 1 PM (1-13 hours)
  return currentHour >= 1 && currentHour < 13 ? 'morning' : 'evening';
};

const DayBook = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [entries, setEntries] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collectionForm, setCollectionForm] = useState({
    type: 'milk',
    quantity: '',
    shift: determineShift()
  });
  const [transactionForm, setTransactionForm] = useState({
    customerId: '',
    amountPaid: '',
    paymentMode: 'cash'
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);

  useEffect(() => {
    fetchDayBook();
    fetchCustomers();
  }, [selectedDate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCollectionForm(prev => ({
        ...prev,
        shift: determineShift()
      }));
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const fetchDayBook = async () => {
    try {
      setLoading(true);
      const response = await dayBookService.getEntries(selectedDate);
      if (response.success) {
        setEntries(response.data);
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to fetch entries', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getCustomers();
      if (response.success) {
        setCustomers(response.data);
      }
    } catch (error) {
      enqueueSnackbar('Failed to fetch customers', { variant: 'error' });
    }
  };

  const searchCustomers = async (searchText) => {
    try {
      setIsSearching(true);
      const response = await customerService.searchCustomers(searchText);
      if (response.success) {
        setFilteredCustomers(response.data);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      enqueueSnackbar('Failed to search customers', { variant: 'error' });
    } finally {
      setIsSearching(false);
    }
  };

  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const debouncedSearch = debounce(searchCustomers, 300);

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c._id === customerId);
    setSelectedCustomer(customer);
    setTransactionForm(prev => ({ ...prev, customerId }));
  };

  const handleAddCollection = async () => {
    try {
      const response = await dayBookService.addCollection({
        date: selectedDate,
        ...collectionForm
      });
      if (response.success) {
        enqueueSnackbar('Collection added successfully', { variant: 'success' });
        handleClose();
        fetchDayBook();
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to add collection', { variant: 'error' });
    }
  };

  const handleAddTransaction = async () => {
    try {
      const response = await dayBookService.addTransaction({
        date: selectedDate,
        ...transactionForm
      });
      if (response.success) {
        enqueueSnackbar('Transaction added successfully', { variant: 'success' });
        handleClose();
        fetchDayBook();
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to add transaction', { variant: 'error' });
    }
  };

  const handleClose = () => {
    setOpenDialog(false);
    setDialogType('');
    setCollectionForm({ type: 'milk', quantity: '', shift: determineShift() });
    setTransactionForm({ customerId: '', amountPaid: '', paymentMode: 'cash' });
    setSelectedCustomer(null);
  };

  const handlePrintReceipt = (transaction) => {
    console.log('Transaction11:', transaction);
    setSelectedTransaction(transaction);
    setShowReceipt(true);
  };

  const fetchDailyReport = async (date) => {
    try {
      setLoading(true);
      const formattedDate = new Date(date).toISOString().split('T')[0];
      const response = await dayBookService.getEntries(formattedDate);
      console.log('Daily report response:', response); // Debug log
      
      if (response.success) {
        setEntries(response.data);
      }
    } catch (error) {
      console.error('Error fetching daily report:', error);
      enqueueSnackbar('Failed to fetch daily report', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintMultipleReceipts = () => {
    setSelectedTransaction(selectedTransactions);
    setShowReceipt(true);
  };

  const actions = [
    {
      icon: <AddIcon />,
      label: 'Add Transaction',
      onClick: () => setTransactionDialogOpen(true),
      color: 'primary'
    },
    {
      icon: <ReceiptIcon />,
      label: 'Add Sale',
      onClick: () => setSaleDialogOpen(true),
      color: 'success'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12} sx={{ mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Typography variant="h4">Day Book</Typography>
            </Grid>
            <Grid item>
              <TextField
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </Grid>
            <Grid item xs />
            <Grid item>
              <Button 
                variant="contained" 
                onClick={() => {
                  setDialogType('collection');
                  setOpenDialog(true);
                }}
                sx={{ mr: 1 }}
              >
                Add Collection
              </Button>
              <Button 
                variant="contained"
                onClick={() => {
                  setDialogType('transaction');
                  setOpenDialog(true);
                }}
                sx={{ mr: 1 }}
              >
                Add Transaction
              </Button>
              <Button 
                variant="contained"
                color="success"
                startIcon={<ReceiptIcon />}
                onClick={() => setSaleDialogOpen(true)}
              >
                Add Sale
              </Button>
            </Grid>
          </Grid>
        </Grid>

        {/* Summary Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Collections</Typography>
                  <Typography>Milk: {entries?.summary.totalMilk || 0} L</Typography>
                  <Typography>Eggs: {entries?.summary.totalEggs || 0} Pcs</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Transactions</Typography>
                  <Typography>Total Payments: ₹{entries?.summary.totalPayments || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
            >
              <Tab label="Collections" />
              <Tab label="Transactions" />
            </Tabs>

            {/* Collections Tab */}
            {activeTab === 0 && (
              <Box sx={{ height: 500, width: '100%' }}>
                <DataGrid
                  rows={entries?.collections.map((entry, index) => ({
                    id: index,
                    time: new Date(entry.createdAt).toLocaleTimeString(),
                    type: entry.type,
                    shift: entry.shift,
                    quantity: `${entry.quantity} ${entry.type === 'milk' ? 'L' : 'Pcs'}`
                  })) || []}
                  columns={[
                    { field: 'time', headerName: 'Time', flex: 1, sortable: true },
                    { field: 'type', headerName: 'Type', flex: 1, sortable: true },
                    { field: 'shift', headerName: 'Shift', flex: 1, sortable: true },
                    { field: 'quantity', headerName: 'Quantity', flex: 1, sortable: true }
                  ]}
                  autoHeight
                  pageSize={10}
                  rowsPerPageOptions={[10, 25, 50]}
                  disableSelectionOnClick
                  sx={{
                    '& .MuiDataGrid-root': {
                      border: 'none',
                    },
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid #f0f0f0',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: '#f5f5f5',
                      borderBottom: 'none',
                    },
                    '& .MuiDataGrid-virtualScroller': {
                      backgroundColor: '#fff',
                    },
                    '& .MuiDataGrid-cell:hover': {
                      color: 'primary.main',
                    },
                    boxShadow: 2,
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}
                />
              </Box>
            )}

            {/* Transactions Tab */}
            {activeTab === 1 && (
              <Box sx={{ height: 500, width: '100%' }}>
                {selectedTransactions.length > 1 && (
                  <Grid container justifyContent="flex-end" sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<PrintIcon />}
                      onClick={handlePrintMultipleReceipts}
                    >
                      Print Selected Receipts ({selectedTransactions.length})
                    </Button>
                  </Grid>
                )}
                <DataGrid
                  rows={entries?.transactions.map((transaction, index) => ({
                    id: index,
                    time: new Date(transaction.createdAt).toLocaleTimeString(),
                    customer: transaction.customerId?.name || 'N/A',
                    amountPaid: `₹${transaction.amountPaid.toFixed(2)}`,
                    paymentMode: transaction.paymentMode === 'cash' ? 'Cash' : 'Account Transfer',
                    actions: transaction,
                    transaction: transaction
                  })) || []}
                  checkboxSelection
                  onRowSelectionModelChange={(newSelectionModel) => {
                    const selectedRows = newSelectionModel.map(index => entries.transactions[index]);
                    setSelectedTransactions(selectedRows);
                  }}
                  columns={[
                    { field: 'time', headerName: 'Time', flex: 1, sortable: true },
                    { field: 'customer', headerName: 'Customer', flex: 1.5, sortable: true },
                    { field: 'amountPaid', headerName: 'Amount Paid', flex: 1, sortable: true },
                    { field: 'paymentMode', headerName: 'Payment Mode', flex: 1, sortable: true },
                    {
                      field: 'actions',
                      headerName: 'Actions',
                      flex: 0.5,
                      sortable: false,
                      renderCell: (params) => (
                        <IconButton 
                          onClick={() => handlePrintReceipt(params.value)}
                          color="primary"
                          size="small"
                        >
                          <PrintIcon />
                        </IconButton>
                      )
                    }
                  ]}
                  autoHeight
                  pageSize={10}
                  rowsPerPageOptions={[10, 25, 50]}
                  disableSelectionOnClick
                  sx={{
                    '& .MuiDataGrid-root': {
                      border: 'none',
                    },
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid #f0f0f0',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: '#f5f5f5',
                      borderBottom: 'none',
                    },
                    '& .MuiDataGrid-virtualScroller': {
                      backgroundColor: '#fff',
                    },
                    '& .MuiDataGrid-cell:hover': {
                      color: 'primary.main',
                    },
                    boxShadow: 2,
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}
                />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Add Entry Dialog */}
      <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Add {dialogType === 'collection' ? 'Collection' : 'Transaction'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {dialogType === 'collection' && (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={collectionForm.type}
                      onChange={(e) => setCollectionForm({
                        ...collectionForm,
                        type: e.target.value
                      })}
                    >
                      <MenuItem value="milk">Milk</MenuItem>
                      <MenuItem value="eggs">Eggs</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth disabled>
                    <InputLabel>Shift</InputLabel>
                    <Select
                      value={collectionForm.shift}
                      label="Shift"
                    >
                      <MenuItem value="morning">Morning</MenuItem>
                      <MenuItem value="evening">Evening</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    type="number"
                    value={collectionForm.quantity}
                    onChange={(e) => setCollectionForm({
                      ...collectionForm,
                      quantity: e.target.value
                    })}
                  />
                </Grid>
              </>
            )}

            {dialogType === 'transaction' && (
              <>
                <Grid item xs={12}>
                  <Autocomplete
                    fullWidth
                    options={filteredCustomers}
                    getOptionLabel={(option) => option.name || ''}
                    loading={isSearching}
                    inputValue={searchInputValue}
                    onInputChange={(event, newInputValue) => {
                      setSearchInputValue(newInputValue);
                      if (newInputValue.length >= 2) {
                        debouncedSearch(newInputValue);
                      }
                    }}
                    onChange={(event, newValue) => {
                      if (newValue) {
                        handleCustomerChange(newValue._id);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search Customer"
                        variant="outlined"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isSearching ? (
                                <CircularProgress color="inherit" size={20} />
                              ) : (
                                <SearchIcon color="action" />
                              )}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box>
                          <Typography variant="body1">{option.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            Balance: ₹{option.currentBalance?.toFixed(2) || '0.00'}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    noOptionsText={
                      searchInputValue.length < 2 
                        ? "Type at least 2 characters to search" 
                        : isSearching 
                          ? "Searching..." 
                          : "No customers found"
                    }
                  />
                </Grid>

                {selectedCustomer && (
                  <>
                   <Grid item xs={12}>
                   <TextField
                     fullWidth
                     label="Contact Number"
                     value={selectedCustomer.contactNumber || 'N/A'}
                     disabled
                     variant="outlined"
                   />
                 </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Previous Balance"
                      value={selectedCustomer.currentBalance || 0}
                      disabled
                    />
                  </Grid>
                  </>
                )}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Amount Paid"
                    type="number"
                    value={transactionForm.amountPaid}
                    onChange={(e) => setTransactionForm({
                      ...transactionForm,
                      amountPaid: e.target.value
                    })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Mode</InputLabel>
                    <Select
                      value={transactionForm.paymentMode}
                      onChange={(e) => setTransactionForm({
                        ...transactionForm,
                        paymentMode: e.target.value
                      })}
                    >
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="account_transfer">Account Transfer</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={dialogType === 'collection' ? handleAddCollection : handleAddTransaction}
            variant="contained"
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Receipt Dialog */}
      <Receipt 
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        transactionData={selectedTransaction}
      />

      <AddSaleDialog
        open={saleDialogOpen}
        onClose={() => setSaleDialogOpen(false)}
      />
    </Box>
  );
};

export default DayBook;