import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Autocomplete,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Divider,
  Alert,
  CircularProgress,
  Grid,
  tableCellClasses,
  MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { styled } from '@mui/material/styles';
import * as productService from '../services/productService';
import * as livestockService from '../services/livestockService';
import CloseIcon from '@mui/icons-material/Close';
import useResponsiveness from '../hooks/useResponsive';
import * as saleServices from '../services/saleServices';
import { useSnackbar } from 'notistack';
import * as companySettingsService from '../services/companySettingsService';
import accountService from '../services/accountService';


// Styled components for better appearance
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const CreateInvoiceDialog = ({ open, onClose, customer }) => {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [livestock, setLivestock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [error, setError] = useState('');
  const [saleNumber, setSaleNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const { isMobile, isTablet } = useResponsiveness();
  const [itemType, setItemType] = useState('product'); // 'product' or 'livestock'

  const [currentItem, setCurrentItem] = useState({
    id: '',
    name: '',
    quantity: 1,
    weight: 0,
    rate: 0,
    total: 0,
    type: '',
    remainingStock: 0,
    unit: ''
  });

  // Create ref for the Autocomplete input
  const autocompleteRef = React.useRef(null);

  // Add ref for the item Autocomplete
  const itemInputRef = React.useRef(null);

  const { enqueueSnackbar } = useSnackbar();

  const [paymentType, setPaymentType] = useState('credit');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const [previousBalance, setPreviousBalance] = useState(0);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError('');
      try {
        const [productsRes, livestockRes] = await Promise.all([
          productService.getAllProducts(),
          livestockService.getAllLivestock()
        ]);

        // Handle products
        const productsData = Array.isArray(productsRes) ? productsRes : productsRes?.data || [];
        setProducts(productsData.map(p => ({
          ...p,
          name: p.name,
          price: p.price || 0,
          type: 'product',
          remainingStock: p.currentStock,
          unit: p.unit || 'pcs'
        })));

        // Handle livestock - adjust based on your API response structure
        const livestockData = livestockRes?.data?.data || livestockRes || [];
        console.log('Raw livestock data:', livestockData);
        
        setLivestock(livestockData.map(l => ({
          ...l,
          _id: l._id,
          name: `${l.category} - ${l.type}`,
          price: l.price || 0,
          type: 'livestock',
          remainingStock: l.quantity || 0,
          unit: 'pcs'
        })));

      } catch (error) {
        console.error('Error fetching items:', error);
        setError('Failed to fetch items. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchItems();
    }
  }, [open]);

  useEffect(() => {
    const fetchSaleNumber = async () => {
      try {
        const response = await companySettingsService.getNextSaleNumber();
        if (response.success) {
          setSaleNumber(response.data.nextSaleNumber);
        }
        console.log(response.data.nextSaleNumber);
      } catch (error) {
        console.error('Error fetching sale number:', error);
        enqueueSnackbar('Failed to fetch sale number', { variant: 'error' });
      }
    };

    if (open) {
      fetchSaleNumber();
    }
  }, [open]);

  useEffect(() => {
    const fetchAccounts = async () => {
      if (paymentType === 'payment') {
        try {
          // First fetch Cash accounts
          const cashResponse = await accountService.getAccounts({
            accountType: 'Cash'
          });
          
          // Then fetch Bank accounts
          const bankResponse = await accountService.getAccounts({
            accountType: 'Bank'
          });
          
          // Combine both results
          const combinedAccounts = [
            ...(cashResponse.data || []),
            ...(bankResponse.data || [])
          ];

          if (combinedAccounts.length === 0) {
            enqueueSnackbar('No cash or bank accounts found. Please create them first.', { 
              variant: 'warning' 
            });
            return;
          }
          
          setAccounts(combinedAccounts);
        } catch (error) {
          console.error('Error fetching accounts:', error);
          enqueueSnackbar('Failed to fetch accounts', { variant: 'error' });
        }
      }
    };

    fetchAccounts();
  }, [paymentType]);

  useEffect(() => {
    const fetchCustomerBalance = async () => {
      if (customer?._id) {
        try {
          const response = await accountService.getAccountBalance(customer._id);
          setPreviousBalance(response.data.balance || 0);
        } catch (error) {
          console.error('Error fetching customer balance:', error);
        }
      }
    };

    fetchCustomerBalance();
  }, [customer]);

  // Add useEffect to focus on input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (itemInputRef.current) {
          const input = itemInputRef.current.querySelector('input');
          if (input) {
            input.focus();
          }
        }
      }, 100);
    }
  }, [open]);

  const updateItemCalculations = (field, value) => {
    setCurrentItem(prev => {
      const updates = { ...prev, [field]: value };
      
      // Calculate total based on weight first, then quantity
      if (field === 'quantity' || field === 'weight' || field === 'rate') {
        if (updates.weight > 0) {
          // When weight exists, use weight-based calculation
          updates.total = (updates.weight * updates.rate).toFixed(2);
        } else if (updates.quantity > 0) {
          // When no weight but quantity exists, use quantity-based calculation
          updates.total = (updates.quantity * updates.rate).toFixed(2);
        } else {
          // If neither exists, set total to 0
          updates.total = 0;
        }
      }
      
      return updates;
    });
  };

  const validateItemInput = () => {
    if (!selectedStock) {
      setError('Please select an item');
      return false;
    }
    
    // Check if either weight or quantity is provided
    if (!currentItem.weight && !currentItem.quantity) {
      setError('Please provide either weight or quantity');
      return false;
    }
    
    if (currentItem.weight < 0) {
      setError('Weight cannot be negative');
      return false;
    }
    
    if (currentItem.quantity < 0) {
      setError('Quantity cannot be negative');
      return false;
    }
    
    if (!currentItem.weight && currentItem.quantity > currentItem.remainingStock) {
      setError('Quantity cannot exceed available stock');
      return false;
    }
    
    if (currentItem.rate <= 0) {
      setError('Rate must be greater than 0');
      return false;
    }
    
    return true;
  };

  const handleItemSelect = (event, value) => {
    setError('');
    if (value) {
      console.log('Selected stock item with unit:', value.unit);
      setSelectedStock(value);
      setCurrentItem({
        ...currentItem,
        id: value._id,
        productId: value._id,
        name: value.name,
        rate: value.price || 0,
        type: value.type,
        remainingStock: value.remainingStock,
        unit: value.unit,
        total: (currentItem.quantity * (value.price || 0))
      });
    }
  };

  const handleAddItem = () => {
    if (!validateItemInput()) {
      return;
    }

    const newItem = {
      id: selectedStock._id,
      productId: selectedStock._id,
      name: selectedStock.name,
      quantity: currentItem.quantity,
      weight: currentItem.weight || 0,
      rate: currentItem.rate,
      total: currentItem.total,
      type: selectedStock.type,
      remainingStock: selectedStock.remainingStock,
      unit: currentItem.weight > 0 ? 'kg' : selectedStock.unit
    };

    console.log('Adding item with unit:', newItem.unit);
    setItems(prevItems => [...prevItems, newItem]);
    
    // Reset current item and selection
    setSelectedStock(null);
    setCurrentItem({
      id: '',
      name: '',
      quantity: 1,
      weight: 0,
      rate: 0,
      total: 0,
      type: '',
      remainingStock: 0,
      unit: ''
    });
  };

  const handleRemoveItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + parseFloat(item.total), 0).toFixed(2);
  };

  const handleSubmit = async () => {
    try {
      if (paymentType === 'payment' && (!selectedAccount || paidAmount <= 0)) {
        enqueueSnackbar('Please fill in all payment details', { variant: 'error' });
        return;
      }

      const grandTotal = Number(calculateGrandTotal());
      const remainingBalance = paymentType === 'payment' ? 
        Math.max(0, grandTotal - paidAmount) : 
        grandTotal;

      const saleData = {
        saleNumber: saleNumber,
        date: invoiceDate,
        customer: customer._id,
        items: items.map(item => ({
          itemId: item.productId,
          itemType: item.type === 'product' ? 'Product' : 'Livestock',
          name: item.name,
          quantity: Number(item.quantity),
          price: Number(item.rate),
          total: Number(item.total),
          weight: Number(item.weight || 0),
          unit: item.weight > 0 ? 'kg' : (item.name.toLowerCase().includes('milk') ? 'L' : 'pcs')
        })),
        grandTotal: grandTotal,
        paidAmount: paymentType === 'payment' ? paidAmount : 0,
        remainingBalance: remainingBalance,
        whatsappNotification: true,
        paymentType,
        paymentDetails: paymentType === 'payment' ? {
          accountId: selectedAccount,
          amount: paidAmount
        } : null
      };

      const response = await saleServices.createSale(saleData);
      
      if (response.success) {
        if (response.invoice?.whatsappSent) {
          enqueueSnackbar('Invoice created and sent via WhatsApp', { variant: 'success' });
        } else {
          enqueueSnackbar('Invoice created successfully', { variant: 'success' });
          if (response.invoice?.whatsappError) {
            enqueueSnackbar(`WhatsApp notification failed: ${response.invoice.whatsappError}`, { variant: 'warning' });
          }
        }
        onClose();
      } else {
        throw new Error(response.message || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Invoice creation error:', error);
      setError(error.message || 'Failed to create invoice');
      enqueueSnackbar(error.message || 'Failed to create invoice', { variant: 'error' });
    }
  };

  // Update customer details display
  const CustomerDetailsSection = () => (
    <>
      <Grid item xs={12}>
        <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>Customer Details</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Customer Name"
          value={customer?.customerName || ''}
          disabled
          variant="outlined"
          InputProps={{
            readOnly: true,
            sx: { bgcolor: 'action.hover' }
          }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Contact Number"
          value={customer?.contactNo || ''}
          disabled
          variant="outlined"
          InputProps={{
            readOnly: true,
            sx: { bgcolor: 'action.hover' }
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Address"
          value={customer?.address || ''}
          disabled
          variant="outlined"
          multiline
          rows={2}
          InputProps={{
            readOnly: true,
            sx: { bgcolor: 'action.hover' }
          }}
        />
      </Grid>
    </>
  );

  // Add this section to your render method, before the items table
  const renderItemSelection = () => (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2}>
        {/* Fixed width container for type and item selection */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Item Type"
                value={itemType}
                onChange={(e) => {
                  setItemType(e.target.value);
                  setSelectedStock(null);
                  setCurrentItem(prev => ({
                    ...prev,
                    id: '',
                    name: '',
                    quantity: 1,
                    weight: 0,
                    rate: 0,
                    total: 0,
                    type: '',
                    remainingStock: 0,
                    unit: ''
                  }));
                }}
                size={isMobile ? "small" : "medium"}
              >
                <MenuItem value="product">Product</MenuItem>
                <MenuItem value="livestock">Livestock</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={8}>
              <Autocomplete
                ref={itemInputRef}
                options={itemType === 'product' ? products : livestock}
                getOptionLabel={(option) => option.name}
                value={selectedStock}
                onChange={handleItemSelect}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Item"
                    size={isMobile ? "small" : "medium"}
                    error={Boolean(error)}
                    helperText={error}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loading ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body1">
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Stock: {option.remainingStock} {option.unit} • Price: ₹{option.price}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Input Fields Container - Always rendered but conditionally visible */}
        <Grid item xs={12}>
          <Grid container spacing={2} sx={{ 
            visibility: selectedStock ? 'visible' : 'hidden',
            height: selectedStock ? 'auto' : '0px',
            overflow: 'hidden',
            transition: 'height 0.2s ease-in-out'
          }}>
            {/* Weight field - Only for livestock */}
            <Grid item xs={12} sm={4}>
              <Box sx={{ 
                visibility: itemType === 'livestock' ? 'visible' : 'hidden',
                height: itemType === 'livestock' ? 'auto' : '0px',
                overflow: 'hidden'
              }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Weight (kg)"
                  value={currentItem.weight}
                  onChange={(e) => updateItemCalculations('weight', parseFloat(e.target.value))}
                  size={isMobile ? "small" : "medium"}
                  InputProps={{
                    inputProps: { min: 0, step: 0.1 }
                  }}
                />
              </Box>
            </Grid>

            {/* Quantity and Rate fields */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                value={currentItem.quantity}
                onChange={(e) => updateItemCalculations('quantity', parseInt(e.target.value))}
                size={isMobile ? "small" : "medium"}
                InputProps={{
                  inputProps: { min: 1 }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Rate"
                value={currentItem.rate}
                onChange={(e) => updateItemCalculations('rate', parseFloat(e.target.value))}
                size={isMobile ? "small" : "medium"}
                InputProps={{
                  inputProps: { min: 0, step: 0.01 }
                }}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Add Item Button */}
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddItem}
            disabled={!selectedStock || (!currentItem.quantity && !currentItem.weight) || !currentItem.rate}
            size={isMobile ? "small" : "medium"}
          >
            Add Item
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ sx: { minHeight: '80vh' } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 4 }}>
          <Typography variant="h6" component="div">
            Create Invoice - {customer?.customerName}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Invoice Details Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>Invoice Details</Typography>
          </Grid>
          
          {/* Invoice Number and Date */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Sale Number"
              value={saleNumber}
              disabled
              variant="outlined"
              InputProps={{
                readOnly: true,
                sx: { bgcolor: 'action.hover' }
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Invoice Date"
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          {/* Customer Details Section */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>Customer Details</Typography>
          </Grid>
          <CustomerDetailsSection />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {/* Item Selection */}
          {renderItemSelection()}

          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow>
                  <StyledTableCell>Item Name</StyledTableCell>
                  <StyledTableCell>Type</StyledTableCell>
                  <StyledTableCell align="right">Quantity</StyledTableCell>
                  <StyledTableCell align="right">Weight (kg)</StyledTableCell>
                  <StyledTableCell align="right">Rate</StyledTableCell>
                  <StyledTableCell align="right">Total</StyledTableCell>
                  <StyledTableCell align="center">Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <StyledTableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">{item.weight}</TableCell>
                    <TableCell align="right">{item.rate}</TableCell>
                    <TableCell align="right">{item.total}</TableCell>
                    <TableCell align="center">
                      <IconButton color="error" onClick={() => handleRemoveItem(item.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </StyledTableRow>
                ))}
                <StyledTableRow>
                  <TableCell colSpan={5} align="right">
                    <Typography variant="subtitle1">
                      <strong>Grand Total:</strong>
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle1">
                      <strong>{calculateGrandTotal()}</strong>
                    </Typography>
                  </TableCell>
                  <TableCell />
                </StyledTableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Payment Section */}
          <Grid container spacing={2} sx={{ mt: 3 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>Payment Details</Typography>
            </Grid>


            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Payment Type"
                value={paymentType}
                onChange={(e) => {
                  setPaymentType(e.target.value);
                  if (e.target.value === 'credit') {
                    setSelectedAccount('');
                    setPaidAmount(0);
                  } else if (e.target.value === 'payment') {
                    setPaidAmount(0);
                  }
                }}
              >
                <MenuItem value="credit">Save as Credit</MenuItem>
                <MenuItem value="payment">Make Payment</MenuItem>
              </TextField>
            </Grid>

            {paymentType === 'payment' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Select Account"
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    error={!selectedAccount && paymentType === 'payment'}
                    helperText={!selectedAccount && paymentType === 'payment' ? 'Please select an account' : ''}
                  >
                    {accounts.map((account) => (
                      <MenuItem key={account._id} value={account._id}>
                        {account.accountName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Payment Amount"
                    value={paidAmount}
                    onChange={(e) => {
                      const newAmount = Number(e.target.value);
                      if (newAmount >= 0) {
                        setPaidAmount(newAmount);
                      }
                    }}
                    error={paymentType === 'payment' && paidAmount <= 0}
                    helperText={paymentType === 'payment' && paidAmount <= 0 ? 'Please enter valid amount' : ''}
                    InputProps={{
                      inputProps: { 
                        min: 0,
                        step: 0.01 
                      }
                    }}
                  />
                </Grid>

                {/* Payment Summary Box */}
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'background.paper', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: theme => theme.palette.primary.main,
                    mt: 2 
                  }}>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="primary">
                          Payment Breakdown
                        </Typography>
                      </Grid>
                      
                      {/* Invoice Details */}
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Invoice Amount: ₹{calculateGrandTotal()}
                        </Typography>
                      </Grid>

                      {/* Payment Adjustment */}
                      {paidAmount > 0 && (
                        <>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              Payment Amount: ₹{paidAmount.toFixed(2)}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                              Adjusted Against Invoice: ₹{Math.min(paidAmount, Number(calculateGrandTotal())).toFixed(2)}
                            </Typography>
                          </Grid>

                          {/* Show advance amount if payment is more than invoice */}
                          {paidAmount > Number(calculateGrandTotal()) && (
                            <Grid item xs={12}>
                              <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                Advance Carry Forward: ₹{(paidAmount - Number(calculateGrandTotal())).toFixed(2)}
                              </Typography>
                            </Grid>
                          )}

                          {/* Show remaining if payment is less than invoice */}
                          {paidAmount < Number(calculateGrandTotal()) && (
                            <Grid item xs={12}>
                              <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                                Remaining Balance: ₹{(Number(calculateGrandTotal()) - paidAmount).toFixed(2)}
                              </Typography>
                            </Grid>
                          )}
                        </>
                      )}
                    </Grid>
                  </Box>
                </Grid>
              </>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          color="primary"
          disabled={items.length === 0 || loading}
          onClick={handleSubmit}
        >
          {loading ? <CircularProgress size={24} /> : 'Create Invoice'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateInvoiceDialog; 