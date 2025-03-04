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
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Divider
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
import { getSalesByDate } from '../services/saleServices';
import {
  ShoppingCart as ShoppingCartIcon,
  PointOfSale as PointOfSaleIcon,
  Payments as PaymentsIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon
} from '@mui/icons-material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PrintInvoice from '../components/PrintInvoice';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import GroupInvoiceDialog from '../components/GroupInvoiceDialog';
import * as productService from '../services/productService';
import AddPaymentDialog from '../components/AddPaymentDialog';

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
  const [paymentForm, setPaymentForm] = useState({
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
  const [selectedTab, setSelectedTab] = useState('collections');
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [printInvoiceOpen, setPrintInvoiceOpen] = useState(false);
  const [groupInvoiceOpen, setGroupInvoiceOpen] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchDayBook();
    fetchCustomers();
    fetchInvoices(selectedDate);
    fetchProducts();
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
      console.error('Error fetching customers:', error);
    }
  };

  const fetchInvoices = async (date) => {
    setLoadingInvoices(true);
    try {
      const response = await getSalesByDate(date);
      setInvoices(response.data || []);
      console.log('Invoices111:', response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      enqueueSnackbar('Failed to fetch invoices', { variant: 'error' });
    } finally {
      setLoadingInvoices(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productService.getAllProducts();
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
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
    setPaymentForm(prev => ({ ...prev, customerId }));
  };

  const handleAddCollection = async () => {
    try {
      const selectedProduct = products.find(p => p._id === collectionForm.productId);
      if (!selectedProduct) {
        throw new Error('Please select a product');
      }

      const response = await productService.updateStock({
        productId: collectionForm.productId,
        quantity: collectionForm.quantity,
        date: selectedDate,
        shift: collectionForm.shift,
        transactionType: 'Collection'
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

  const handleAddPayment = async () => {
    try {
      const response = await dayBookService.addTransaction({
        date: selectedDate,
        ...paymentForm
      });
      if (response.success) {
        enqueueSnackbar('Payment added successfully', { variant: 'success' });
        handleClose();
        fetchDayBook();
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to add payment', { variant: 'error' });
    }
  };

  const handleClose = () => {
    setOpenDialog(false);
    setDialogType('');
    setCollectionForm({ type: 'milk', quantity: '', shift: determineShift() });
    setPaymentForm({ customerId: '', amountPaid: '', paymentMode: 'cash' });
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

  const fetchDayData = async (selectedDate) => {
    setLoading(true);
    setLoadingInvoices(true);
    try {
      // Your existing collection and transaction fetches
      const [collectionsRes, transactionsRes, invoicesRes] = await Promise.all([
        dayBookService.getCollectionsByDate(selectedDate),
        dayBookService.getTransactionsByDate(selectedDate),
        getSalesByDate(selectedDate)
      ]);

      setEntries(collectionsRes.data || []);
      setSelectedTransactions(transactionsRes.data || []);
      setInvoices(invoicesRes.data || []);
    } catch (error) {
      console.error('Error fetching day data:', error);
      enqueueSnackbar('Failed to fetch day data', { variant: 'error' });
    } finally {
      setLoading(false);
      setLoadingInvoices(false);
    }
  };

  const handleTabChange = async (event, newValue) => {
    setIsTabLoading(true);
    setSelectedTab(newValue);
    
    try {
      if (newValue === 'sales' && selectedDate) {
        await fetchInvoices(selectedDate);
      }
    } catch (error) {
      console.error('Error loading tab data:', error);
    } finally {
      setIsTabLoading(false);
    }
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setIsTabLoading(true);
    Promise.all([
      fetchDayBook(),
      fetchInvoices(newDate)
    ]).finally(() => {
      setIsTabLoading(false);
    });
  };

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
            <Grid item xs={6} md={3}>
              <TextField
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                fullWidth
                size={isMobile ? "small" : "medium"}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={6} md={6}>
              <Box sx={{ 
                display: 'flex', 
                gap: 1,
                justifyContent: 'flex-end',
                ml: isMobile ? 3 : 0
              }}>
                <Tooltip title={isMobile ? "Add Collection" : ""}>
                  <Button 
                    variant="contained"
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

                <Tooltip title={isMobile ? "Add Payment" : ""}>
                  <Button 
                    variant="contained"
                    onClick={() => {
                      setDialogType('payment');
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
                        Add Payment
                      </>
                    )}
                  </Button>
                </Tooltip>

                <Tooltip title={isMobile ? "Add Sale" : ""}>
                  <Button 
                    variant="contained"
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

                <Tooltip title={isMobile ? "Group Invoice" : ""}>
                  <Button 
                    variant="contained"
                    color="secondary"
                    onClick={() => setGroupInvoiceOpen(true)}
                    sx={{ 
                      minWidth: isMobile ? '40px' : 'auto',
                      width: isMobile ? '40px' : 'auto',
                      height: isMobile ? '40px' : 'auto',
                      borderRadius: '12px',
                      p: isMobile ? '8px' : 'auto'
                    }}
                  >
                    {isMobile ? (
                      <ReceiptLongIcon />
                    ) : (
                      <>
                        Group Invoice
                      </>
                    )}
                  </Button>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Grid>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Collections Card */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                height: '100%', // Set full height
                minHeight: 180, // Set minimum height
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Collections</Typography>
                <ShoppingCartIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
              <Box sx={{ flexGrow: 1 }}> {/* This will take up remaining space */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Milk:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{entries?.summary.totalMilk || 0}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>L</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Eggs:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{entries?.summary.totalEggs || 0}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Pcs</Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Sales Card */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: 'success.light',
                color: 'success.contrastText',
                height: '100%',
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Total Sales</Typography>
                <PointOfSaleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
              <Box sx={{ flexGrow: 1 }}> {/* This will take up remaining space */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Amount:</Typography>
                  <Typography variant="body2">₹{entries?.summary.totalSales || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Invoices:</Typography>
                  <Typography variant="body2">{entries?.summary.invoiceCount || 0}</Typography>
                </Box>
               
              </Box>
            </Paper>
          </Grid>

          {/* Transactions Card */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: 'warning.light',
                color: 'warning.contrastText',
                height: '100%', 
                minHeight: 120, 
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Payments</Typography>
                <PaymentsIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
              <Box sx={{ flexGrow: 1 }}> {/* This will take up remaining space */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Cash:</Typography>
                  <Typography variant="body2">₹{entries?.summary.payments?.cash || 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Account Transfer:</Typography>
                  <Typography variant="body2">₹{entries?.summary.payments?.accountTransfer || 0}</Typography>
                </Box>
                <Divider sx={{ my: 1, bgcolor: 'warning.contrastText', opacity: 0.2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2">Total:</Typography>
                  <Typography variant="subtitle2">
                    ₹{entries?.summary.payments?.total || 0}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Tabs and DataGrid */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%', mb: 2, minHeight: 400 }}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Collections" value="collections" />
              <Tab label="Transactions" value="transactions" />
              <Tab label="Sales" value="sales" />
            </Tabs>

            {isTabLoading ? (
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  height: 300 // Fixed height for loading state
                }}
              >
                <CircularProgress />
              </Box>
            ) : (
              <>
                {selectedTab === 'collections' && (
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

                {selectedTab === 'transactions' && (
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
                               color="primary"
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

                {selectedTab === 'sales' && (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Invoice No.</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell>Items</TableCell>
                          <TableCell align="right">Total Amount</TableCell>
                          <TableCell align="right">Time</TableCell>
                          <TableCell align="center">WhatsApp</TableCell>
                          <TableCell align="center">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                              <Box sx={{ textAlign: 'center' }}>
                                <ReceiptLongIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                <Typography color="textSecondary">
                                  No sales found for selected date
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <>
                            {invoices.map((invoice) => (
                              <TableRow key={invoice._id}>
                                <TableCell>{invoice.saleNumber}</TableCell>
                                <TableCell>{invoice.customer?.name}</TableCell>
                                <TableCell>
                                  {invoice.items.map(item => (
                                    <Typography variant="caption" display="block" key={item._id}>
                                      {item.name} ({item.quantity} {item.unit})
                                    </Typography>
                                  ))}
                                </TableCell>
                                <TableCell align="right">₹{invoice.grandTotal}</TableCell>
                                <TableCell align="right">
                                  {new Date(invoice.createdAt).toLocaleTimeString()}
                                </TableCell>
                                <TableCell align="center">
                                  <Tooltip title={invoice.whatsappSent ? "Sent to WhatsApp" : "Not sent to WhatsApp"}>
                                    <WhatsAppIcon 
                                      color={invoice.whatsappSent ? "success" : "disabled"} 
                                      sx={{ fontSize: 20 }}
                                    />
                                  </Tooltip>
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton 
                                    onClick={() => {
                                      setSelectedInvoice(invoice);
                                      setPrintInvoiceOpen(true);
                                    }}
                                    size="small"
                                    color="primary"
                                  >
                                    <PrintIcon />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell colSpan={3} align="right">
                                <strong>Total Sales:</strong>
                              </TableCell>
                              <TableCell align="right">
                                <strong>
                                  ₹{invoices.reduce((sum, inv) => sum + inv.grandTotal, 0)}
                                </strong>
                              </TableCell>
                              <TableCell />
                              <TableCell />
                              <TableCell />
                            </TableRow>
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
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
          {dialogType === 'collection' ? 'Add Collection' : 'Add Payment'}
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
                    <InputLabel>Product</InputLabel>
                    <Select
                      value={collectionForm.productId || ''}
                      onChange={(e) => setCollectionForm({
                        ...collectionForm,
                        productId: e.target.value,
                        quantity: '' // Reset quantity when product changes
                      })}
                    >
                      {products.map((product) => (
                        <MenuItem key={product._id} value={product._id}>
                          {product.name} ({product.unit})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Quantity"
                    value={collectionForm.quantity}
                    onChange={(e) => setCollectionForm({
                      ...collectionForm,
                      quantity: e.target.value
                    })}
                    InputProps={{
                      endAdornment: products.find(p => p._id === collectionForm.productId)?.unit
                    }}
                    size={isMobile ? "small" : "medium"}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                    <InputLabel>Shift</InputLabel>
                    <Select
                      value={collectionForm.shift}
                      onChange={(e) => setCollectionForm({
                        ...collectionForm,
                        shift: e.target.value
                      })}
                      label="Shift"
                    >
                      <MenuItem value="morning">Morning</MenuItem>
                      <MenuItem value="evening">Evening</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            {dialogType === 'payment' && (
              <AddPaymentDialog
                open={dialogType === 'payment'}
                onClose={handleClose}
                onSuccess={fetchDayBook}
              />
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          {!isMobile && <Button onClick={handleClose}>Cancel</Button>}
          <Button 
            onClick={dialogType === 'collection' ? handleAddCollection : handleAddPayment}
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

      <PrintInvoice 
        open={printInvoiceOpen}
        onClose={() => {
          setPrintInvoiceOpen(false);
          setSelectedInvoice(null);
        }}
        invoiceData={selectedInvoice}
      />

      {/* Add GroupInvoiceDialog component */}
      <GroupInvoiceDialog
        open={groupInvoiceOpen}
        onClose={() => setGroupInvoiceOpen(false)}
        customers={customers}
      />
    </Box>
  );
};

export default DayBook;