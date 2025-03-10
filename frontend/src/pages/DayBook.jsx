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
  IconButton,
  CircularProgress,
  Tooltip,
  Divider,
  Stack,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import dayBookService from '../services/dayBookService';
import customerService from '../services/customerService';
import Receipt from '../components/Receipt';
import { Print as PrintIcon, Close as CloseIcon, Search as SearchIcon } from '@mui/icons-material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import useResponsiveness from '../hooks/useResponsive';
import { getSalesByDate } from '../services/saleServices';
import * as productService from '../services/productService';
import AddTransactionDialog from '../pages/salePurchase/AddTransactionDialog';
import PrintInvoice from '../pages/salePurchase/PrintInvoice';
import GroupSalesDialog from '../pages/salePurchase/GroupSalesDialog';
import PaymentDialog from '../pages/payments/PaymentDialog';
import TransferDialog from '../pages/payments/TransferDialog';
import {
  CallReceived as ReceiveIcon,
  CallMade as GiveIcon,
  CompareArrows as TransferIcon,
} from '@mui/icons-material';

const determineShift = () => {
  const currentHour = new Date().getHours();
  return currentHour >= 1 && currentHour < 13 ? 'morning' : 'evening';
};

const DayBook = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { isMobile } = useResponsiveness();
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [paymentOptionsOpen, setPaymentOptionsOpen] = useState(false);
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [entries, setEntries] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collectionForm, setCollectionForm] = useState({
    type: 'milk',
    quantity: '',
    shift: determineShift(),
  });
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [printInvoiceOpen, setPrintInvoiceOpen] = useState(false);
  const [groupInvoiceOpen, setGroupInvoiceOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    fetchInvoices(fromDate);
    fetchProducts();
    fetchReportData(fromDate, toDate);
  }, [fromDate, toDate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCollectionForm((prev) => ({
        ...prev,
        shift: determineShift(),
      }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
    } catch (error) {
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

  const fetchReportData = async (from, to) => {
    setLoading(true);
    try {
      const response = await dayBookService.getDayBookReport({ startDate: from, endDate: to });
      if (response.success) {
        setReportData(response.data || []);
      }
    } catch (error) {
      enqueueSnackbar('Failed to fetch day book report', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollection = async () => {
    try {
      const selectedProduct = products.find((p) => p._id === collectionForm.productId);
      if (!selectedProduct) throw new Error('Please select a product');

      const response = await productService.updateStock({
        productId: collectionForm.productId,
        quantity: collectionForm.quantity,
        date: fromDate,
        shift: collectionForm.shift,
        transactionType: 'Collection',
      });

      if (response.success) {
        enqueueSnackbar('Collection added successfully', { variant: 'success' });
        handleCloseCollectionDialog();
        fetchReportData(fromDate, toDate);
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to add collection', { variant: 'error' });
    }
  };

  const handleClose = () => {
    setOpenDialog(false);
    setDialogType('');
    setCollectionForm({ type: 'milk', quantity: '', shift: determineShift() });
  };

  const handleCloseCollectionDialog = () => {
    setCollectionDialogOpen(false);
    setCollectionForm({ type: 'milk', quantity: '', shift: determineShift() });
  };

  const handlePrintReceipt = (transaction) => {
    setSelectedTransaction(transaction);
    setShowReceipt(true);
  };

  const handleSearch = () => {
    fetchReportData(fromDate, toDate);
  };

  const handleOpenPaymentOptions = () => {
    setPaymentOptionsOpen(true);
  };

  const handleClosePaymentOptions = () => {
    setPaymentOptionsOpen(false);
    setDialogType('');
  };

  const handleOpenNestedDialog = (type, pType = null) => {
    setDialogType(type);
    if (type === 'payment') {
      setOpenDialog(true);
      setCollectionForm((prev) => ({ ...prev, paymentType: pType }));
    } else if (type === 'transfer') {
      setOpenDialog(true);
    }
    setPaymentOptionsOpen(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getParticularsDescription = (particulars) => {
    if (!particulars || !particulars.contextDescriptions) return '-';
    const descriptions = Object.values(particulars.contextDescriptions);
    return descriptions.length > 0 ? descriptions[0] : '-';
  };

  const getLedgerDetails = (row) => {
    const { ledger, particulars } = row;
    let debit = ledger?.debit || 'Unknown';
    let credit = ledger?.credit || 'Unknown';

    if (particulars?.contextDescriptions && (debit === 'Unknown' || credit === 'Unknown')) {
      const descriptions = particulars.contextDescriptions;
      const debitKey = particulars.debitAccount?._id;
      const creditKey = particulars.creditAccount?._id;

      debit = descriptions[debitKey] || debit;
      credit = descriptions[creditKey] || credit;
    }

    return { debit, credit };
  };

  return (
    <Box sx={{ p: isMobile ? 1 : 3, backgroundColor: '#f5f5f7' }}>
      <Grid container spacing={isMobile ? 1 : 3}>
        <Grid item xs={12} sx={{ mb: isMobile ? 1 : 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 600, color: 'primary.main' }}>
                Day Book
              </Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                type="date"
                label="From"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                fullWidth
                size={isMobile ? 'small' : 'medium'}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <TextField
                type="date"
                label="To"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                fullWidth
                size={isMobile ? 'small' : 'medium'}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={6} md={1}>
              <Tooltip title="Search">
                <IconButton onClick={handleSearch} color="primary">
                  <SearchIcon />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid item xs={6} md={4}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', ml: isMobile ? 3 : 0 }}>
                <Tooltip title={isMobile ? 'Add Collection' : ''}>
                  <Button
                    variant="contained"
                    onClick={() => setCollectionDialogOpen(true)}
                    sx={{
                      minWidth: isMobile ? '40px' : 'auto',
                      width: isMobile ? '40px' : 'auto',
                      height: isMobile ? '40px' : 'auto',
                      borderRadius: '12px',
                      p: isMobile ? '8px' : 'auto',
                    }}
                  >
                    {isMobile ? <AddCircleOutlineIcon /> : 'Add Collection'}
                  </Button>
                </Tooltip>
                <Tooltip title={isMobile ? 'Add Payment' : ''}>
                  <Button
                    variant="contained"
                    onClick={handleOpenPaymentOptions}
                    sx={{
                      minWidth: isMobile ? '40px' : 'auto',
                      width: isMobile ? '40px' : 'auto',
                      height: isMobile ? '40px' : 'auto',
                      borderRadius: '12px',
                      p: isMobile ? '8px' : 'auto',
                    }}
                  >
                    {isMobile ? <PaymentsOutlinedIcon /> : 'Add Payment'}
                  </Button>
                </Tooltip>
                <Tooltip title={isMobile ? 'Add Sale' : ''}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => setSaleDialogOpen(true)}
                    sx={{
                      minWidth: isMobile ? '40px' : 'auto',
                      width: isMobile ? '40px' : 'auto',
                      height: isMobile ? '40px' : 'auto',
                      borderRadius: '12px',
                      p: isMobile ? '8px' : 'auto',
                    }}
                  >
                    {isMobile ? <ShoppingCartOutlinedIcon /> : 'Add Sale'}
                  </Button>
                </Tooltip>
                <Tooltip title={isMobile ? 'Group Invoice' : ''}>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => setGroupInvoiceOpen(true)}
                    sx={{
                      minWidth: isMobile ? '40px' : 'auto',
                      width: isMobile ? '40px' : 'auto',
                      height: isMobile ? '40px' : 'auto',
                      borderRadius: '12px',
                      p: isMobile ? '8px' : 'auto',
                    }}
                  >
                    {isMobile ? <ReceiptLongIcon /> : 'Group Invoice'}
                  </Button>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ width: '100%', mb: 2, minHeight: 400 }}>
            <Typography variant="h6" sx={{ p: 2, fontWeight: 600, backgroundColor: '#f8f9fa' }}>
              Day Book Reporting
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Effective Date</TableCell>
                      <TableCell>Particulars</TableCell>
                      <TableCell>Voucher</TableCell>
                      <TableCell>Ledger</TableCell>
                      <TableCell>Voucher No</TableCell>
                      <TableCell align="right">DR Amount</TableCell>
                      <TableCell align="right">CR Amount</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                          <Typography color="textSecondary">No data found for selected date range</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      reportData.map((row, index) => {
                        const { debit, credit } = getLedgerDetails(row);
                        return (
                          <TableRow key={index} hover>
                            <TableCell>{formatDate(row.effectiveDate)}</TableCell>
                            <TableCell>{getParticularsDescription(row.particulars)}</TableCell>
                            <TableCell>{row.voucher || '-'}</TableCell>
                            <TableCell>
                              Dr: {debit}
                              <br />
                              Cr: {credit}
                            </TableCell>
                            <TableCell>{row.voucherNo || '-'}</TableCell>
                            <TableCell align="right">{formatCurrency(row.drAmount)}</TableCell>
                            <TableCell align="right">{formatCurrency(row.crAmount)}</TableCell>
                            <TableCell align="center">
                              <Tooltip title="Print Receipt">
                                <IconButton
                                  onClick={() => handlePrintReceipt(row)}
                                  size="small"
                                  color="primary"
                                >
                                  <PrintIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Payment Options Dialog */}
      <Dialog
        open={paymentOptionsOpen}
        onClose={handleClosePaymentOptions}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{ p: 2, mb: 2, background: 'linear-gradient(135deg, #4E73DF 0%, #224abe 100%)', color: 'white' }}
        >
          <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={600}>
            Create New Transaction
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Select the type of transaction you want to create
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 2 : 4 }}>
          <Grid container spacing={isMobile ? 2 : 3}>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<ReceiveIcon />}
                onClick={() => handleOpenNestedDialog('payment', 'receive')}
                sx={{
                  py: 2,
                  px: 4,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                  boxShadow: '0 4px 15px rgba(46, 204, 113, 0.2)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #27ae60 0%, #219a52 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(46, 204, 113, 0.3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <Stack spacing={0.5} alignItems="flex-start">
                  <Typography variant="subtitle1" fontWeight={600}>
                    Payment Received
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Record a payment from customer
                  </Typography>
                </Stack>
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<GiveIcon />}
                onClick={() => handleOpenNestedDialog('payment', 'give')}
                sx={{
                  py: 2,
                  px: 4,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                  boxShadow: '0 4px 15px rgba(231, 76, 60, 0.2)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #c0392b 0%, #a93224 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(231, 76, 60, 0.3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <Stack spacing={0.5} alignItems="flex-start">
                  <Typography variant="subtitle1" fontWeight={600}>
                    Payment Given
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Record a payment to supplier
                  </Typography>
                </Stack>
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', px: 2 }}>OR</Typography>
              </Divider>
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<TransferIcon />}
                onClick={() => handleOpenNestedDialog('transfer')}
                sx={{
                  py: 2,
                  px: 4,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #f39c12 0%, #d35400 100%)',
                  boxShadow: '0 4px 15px rgba(243, 156, 18, 0.2)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #d35400 0%, #c44e00 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(243, 156, 18, 0.3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <Stack spacing={0.5} alignItems="flex-start">
                  <Typography variant="subtitle1" fontWeight={600}>
                    Cash/Bank Transfer
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Transfer between accounts
                  </Typography>
                </Stack>
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Nested Dialogs */}
      <PaymentDialog
        open={openDialog && dialogType === 'payment'}
        onClose={handleClose}
        paymentType={collectionForm.paymentType}
        onSuccess={() => fetchReportData(fromDate, toDate)}
      />
      <TransferDialog
        open={openDialog && dialogType === 'transfer'}
        onClose={handleClose}
        onSuccess={() => fetchReportData(fromDate, toDate)}
      />

      {/* Collection Dialog */}
      <Dialog
        open={collectionDialogOpen}
        onClose={handleCloseCollectionDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Add Collection
          {isMobile && (
            <IconButton onClick={handleCloseCollectionDialog} edge="end">
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                <InputLabel>Product</InputLabel>
                <Select
                  value={collectionForm.productId || ''}
                  onChange={(e) =>
                    setCollectionForm({
                      ...collectionForm,
                      productId: e.target.value,
                      quantity: '',
                    })
                  }
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
                onChange={(e) => setCollectionForm({ ...collectionForm, quantity: e.target.value })}
                InputProps={{ endAdornment: products.find((p) => p._id === collectionForm.productId)?.unit }}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                <InputLabel>Shift</InputLabel>
                <Select
                  value={collectionForm.shift}
                  onChange={(e) => setCollectionForm({ ...collectionForm, shift: e.target.value })}
                  label="Shift"
                >
                  <MenuItem value="morning">Morning</MenuItem>
                  <MenuItem value="evening">Evening</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          {!isMobile && <Button onClick={handleCloseCollectionDialog}>Cancel</Button>}
          <Button onClick={handleAddCollection} variant="contained" fullWidth={isMobile}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Receipt open={showReceipt} onClose={() => setShowReceipt(false)} transactionData={selectedTransaction} />
      <AddTransactionDialog
        open={saleDialogOpen}
        onClose={() => setSaleDialogOpen(false)}
        onSuccess={() => fetchReportData(fromDate, toDate)}
      />
      <PrintInvoice
        open={printInvoiceOpen}
        onClose={() => {
          setPrintInvoiceOpen(false);
          setSelectedInvoice(null);
        }}
        invoiceData={selectedInvoice}
      />
      <GroupSalesDialog
        open={groupInvoiceOpen}
        onClose={() => setGroupInvoiceOpen(false)}
        customers={customers}
      />
    </Box>
  );
};

export default DayBook;