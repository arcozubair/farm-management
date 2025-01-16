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
  CircularProgress,
  Tooltip
} from '@mui/material';
import { useSnackbar } from 'notistack';
import dayBookService from '../services/dayBookService';
import customerService from '../services/customerService';
import Receipt from '../components/Receipt';
import { Print as PrintIcon, Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import AddSaleDialog from '../components/AddSaleDialog';
import AddIcon from '@mui/icons-material/Add';
import ReceiptIcon from '@mui/icons-material/Receipt';
import useResponsiveness from '../hooks/useResponsive';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';

const determineShift = () => {
  const currentHour = new Date().getHours();
  // Morning shift: 1 AM to 1 PM (1-13 hours)
  return currentHour >= 1 && currentHour < 13 ? 'morning' : 'evening';
};

const DayBook = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { isMobile, isTablet } = useResponsiveness();
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
    <Box sx={{ 
      p: isMobile ? 1 : 3,
      backgroundColor: '#f5f5f7' 
    }}>
      <Grid container spacing={isMobile ? 1 : 3}>
        {/* Header */}
        <Grid item xs={12} sx={{ mb: isMobile ? 1 : 2 }}>
          <Grid 
            container 
            spacing={2} 
            alignItems="center"
          >
            <Grid item xs={12} md={3}>
              <Typography 
                variant={isMobile ? "h5" : "h4"}
                sx={{ fontWeight: 600, color: 'primary.main' }}
              >
                Day Book
              </Typography>
            </Grid>
            <Grid item xs={6} md={5}>
              <TextField
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                fullWidth
                size={isMobile ? "small" : "medium"}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <Box sx={{ 
                display: 'flex', 
                gap: 1,
                justifyContent: 'flex-end',
                ml: isMobile ? 3 : 0
              }}>
                <Tooltip title={isMobile ? "Add Collection" : ""}>
                  <Button 
                    variant={"contained"}
                    onClick={() => {
                      setDialogType('collection');
                      setOpenDialog(true);
                    }}
                    sx={{ 
                      minWidth: isMobile ? '40px' : 'auto',
                      width: isMobile ? '40px' : 'auto',
                      height: isMobile ? '40px' : 'auto',
                      borderRadius: '12px',
                      p: isMobile ? '8px' : 'auto'
                    }}
                  >
                    {isMobile ? (
                      <AddCircleOutlineIcon />
                    ) : (
                      <>
                        Add Collection
                      </>
                    )}
                  </Button>
                </Tooltip>

                <Tooltip title={isMobile ? "Add Transaction" : ""}>
                  <Button 
                      variant={"contained"}
                    onClick={() => {
                      setDialogType('transaction');
                      setOpenDialog(true);
                    }}
                    sx={{ 
                      minWidth: isMobile ? '40px' : 'auto',
                      width: isMobile ? '40px' : 'auto',
                      height: isMobile ? '40px' : 'auto',
                      borderRadius: '12px',
                      p: isMobile ? '8px' : 'auto'
                    }}
                  >
                    {isMobile ? (
                      <PaymentsOutlinedIcon />
                    ) : (
                      <>
                        Add Transaction
                      </>
                    )}
                  </Button>
                </Tooltip>

                <Tooltip title={isMobile ? "Add Sale" : ""}>
                  <Button 
                     variant={"contained"}
                    color="success"
                    onClick={() => setSaleDialogOpen(true)}
                    sx={{ 
                      minWidth: isMobile ? '40px' : 'auto',
                      width: isMobile ? '40px' : 'auto',
                      height: isMobile ? '40px' : 'auto',
                      borderRadius: '12px',
                      p: isMobile ? '8px' : 'auto'
                    }}
                  >
                    {isMobile ? (
                      <ShoppingCartOutlinedIcon />
                    ) : (
                      <>
                        Add Sale
                      </>
                    )}
                  </Button>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Grid>

        {/* Summary Cards */}
        <Grid item xs={12}>
          <Grid container spacing={isMobile ? 1 : 2}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant={isMobile ? "h6" : "h5"}>Collections</Typography>
                  <Typography>Milk: {entries?.summary.totalMilk || 0} L</Typography>
                  <Typography>Eggs: {entries?.summary.totalEggs || 0} Pcs</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant={isMobile ? "h6" : "h5"}>Transactions</Typography>
                  <Typography>Total Payments: ₹{entries?.summary.totalPayments || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Tabs and DataGrid */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant={isMobile ? "fullWidth" : "standard"}
            >
              <Tab label="Collections" />
              <Tab label="Transactions" />
            </Tabs>

            {activeTab === 0 && (
              <Box sx={{ 
                height: isMobile ? 400 : 500, 
                width: '100%',
                overflow: 'auto'
              }}>
                <DataGrid
                  rows={entries?.collections.map((entry, index) => ({
                    id: index,
                    time: new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    type: entry.type,
                    shift: entry.shift,
                    quantity: `${entry.quantity} ${entry.type === 'milk' ? 'L' : 'Pcs'}`
                  })) || []}
                  columns={[
                    { 
                      field: 'time', 
                      headerName: 'Time', 
                      flex: 0.8,
                      minWidth: 80,
                      sortable: false
                    },
                    { 
                      field: 'type', 
                      headerName: 'Type', 
                      flex: 0.8,
                      minWidth: 70,
                      sortable: false
                    },
                    { 
                      field: 'shift', 
                      headerName: 'Shift', 
                      flex: 1,
                      minWidth: 80,
                      hide: isMobile,
                      sortable: false
                    },
                    { 
                      field: 'quantity', 
                      headerName: 'Qty', 
                      flex: 1,
                      minWidth: 70,
                      sortable: false
                    }
                  ]}
                  pageSize={isMobile ? 5 : 10}
                  rowsPerPageOptions={[5, 10, 25]}
                  disableSelectionOnClick
                  sx={{
                    '& .MuiDataGrid-cell': {
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      px: isMobile ? 1 : 2
                    },
                    '& .MuiDataGrid-columnHeader': {
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      px: isMobile ? 1 : 2
                    }
                  }}
                />
              </Box>
            )}

            {activeTab === 1 && (
              <Box sx={{ 
                height: isMobile ? 400 : 500, 
                width: '100%',
                overflow: 'auto'
              }}>
                <DataGrid
                  rows={entries?.transactions.map((transaction, index) => ({
                    id: index,
                    time: new Date(transaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    customer: transaction.customerId?.name || 'N/A',
                    amountPaid: `₹${transaction.amountPaid.toFixed(2)}`,
                    paymentMode: transaction.paymentMode,
                    actions: transaction
                  })) || []}
                  columns={[
                    { 
                      field: 'time', 
                      headerName: 'Time', 
                      flex: 0.8,
                      minWidth: 80,
                      sortable: false
                    },
                    { 
                      field: 'customer', 
                      headerName: 'Customer', 
                      flex: 1.2,
                      minWidth: 100,
                      sortable: false
                    },
                    { 
                      field: 'amountPaid', 
                      headerName: 'Amount', 
                      flex: 1,
                      minWidth: 90,
                      sortable: false
                    },
                    { 
                      field: 'paymentMode', 
                      headerName: 'Mode', 
                      flex: 1,
                      minWidth: 100,
                      hide: isMobile,
                      sortable: false
                    },
                    {
                      field: 'actions',
                      headerName: 'Action',
                      flex: 0.5,
                      minWidth: isMobile ? 60 : 50,
                      sortable: false,
                      renderCell: (params) => (
                        <IconButton 
                          onClick={() => handlePrintReceipt(params.value)}
                          size={isMobile ? "small" : "medium"}
                        >
                          <PrintIcon />
                        </IconButton>
                      )
                    }
                  ]}
                  pageSize={isMobile ? 5 : 10}
                  rowsPerPageOptions={[5, 10, 25]}
                  disableSelectionOnClick
                  sx={{
                    '& .MuiDataGrid-cell': {
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      px: isMobile ? 1 : 2
                    },
                    '& .MuiDataGrid-columnHeader': {
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      px: isMobile ? 1 : 2
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: '#f8f9fa'
                    }
                  }}
                />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Add Entry Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ 
          pb: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {dialogType === 'collection' ? 'Add Collection' : 'Add Transaction'}
          {isMobile && (
            <IconButton onClick={handleClose} edge="end">
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {dialogType === 'collection' && (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth size={isMobile ? "small" : "medium"}>
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
                  <FormControl fullWidth size={isMobile ? "small" : "medium"} disabled>
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
                    size={isMobile ? "small" : "medium"}
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
                        size={isMobile ? "small" : "medium"}
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
                        size={isMobile ? "small" : "medium"}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Previous Balance"
                        value={selectedCustomer.currentBalance || 0}
                        disabled
                        size={isMobile ? "small" : "medium"}
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
                    size={isMobile ? "small" : "medium"}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size={isMobile ? "small" : "medium"}>
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
        <DialogActions sx={{ p: 2, pt: 0 }}>
          {!isMobile && <Button onClick={handleClose}>Cancel</Button>}
          <Button 
            onClick={dialogType === 'collection' ? handleAddCollection : handleAddTransaction}
            variant="contained"
            fullWidth={isMobile}
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