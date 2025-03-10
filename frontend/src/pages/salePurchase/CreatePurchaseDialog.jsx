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
import * as productService from '../../services/productService';
import * as livestockService from '../../services/livestockService';
import CloseIcon from '@mui/icons-material/Close';
import useResponsiveness from '../../hooks/useResponsive';
import * as purchaseServices from '../../services/purchaseService';
import { useSnackbar } from 'notistack';
import * as companySettingsService from '../../services/companySettingsService';
import accountService from '../../services/accountService';

// Keep the same styled components as CreateInvoiceDialog
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

const CreatePurchaseDialog = ({ open, onClose, supplier }) => {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [livestock, setLivestock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [purchaseNumber, setPurchaseNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const { isMobile, isTablet } = useResponsiveness();
  const [itemType, setItemType] = useState('product');
  const [currentItem, setCurrentItem] = useState({
    id: '',
    name: '',
    quantity: 1,
    weight: 0,
    purchasePrice: 0, // Changed from rate to purchasePrice
    total: 0,
    type: '',
    unit: '',
    sellingPrice: 0, // New field for setting selling rate
    expiryDate: '', // New field for expiry date if applicable
    batchNumber: '', // New field for batch tracking
    gstRate: 0, // New field for GST
    hsnCode: '' // New field for HSN code
  });
  const { enqueueSnackbar } = useSnackbar();
  const [paymentType, setPaymentType] = useState('credit');
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);
  const [previousBalance, setPreviousBalance] = useState(0);
  const [transportCharges, setTransportCharges] = useState(0); // New field
  const [otherCharges, setOtherCharges] = useState(0); // New field
  const [billNumber, setBillNumber] = useState(''); // Supplier's bill number
  const [selectedStock, setSelectedStock] = useState(null);

  const handleItemSelect = (event, value) => {
    if (!value) return;
    
    setSelectedStock(value);
    setCurrentItem({
      id: value._id,
      name: value.name,
      quantity: 1,
      weight: 0,
      purchasePrice: value.rate || 0,
      sellingPrice: value.rate || 0,
      total: value.rate || 0,
      type: value.type,
      unit: value.unit || 'pcs',
      batchNumber: '',
      expiryDate: '',
      gstRate: 0,
      hsnCode: ''
    });
  };

  const updateItemCalculations = (field, value) => {
    setCurrentItem(prev => {
      const updates = { ...prev, [field]: value };
      
      // Calculate total based on quantity and rate
      if (field === 'quantity' || field === 'purchasePrice' || field === 'weight') {
        if (updates.weight > 0) {
          updates.total = updates.weight * updates.purchasePrice;
        } else {
          updates.total = updates.quantity * updates.purchasePrice;
        }
      }
      
      return updates;
    });
  };

  const addItemToList = () => {
    if (!currentItem.id) return;
    
    setItems(prev => [...prev, { ...currentItem }]);
    setSelectedStock(null);
    setCurrentItem({
      id: '',
      name: '',
      quantity: 1,
      weight: 0,
      purchasePrice: 0,
      total: 0,
      type: '',
      unit: '',
      sellingPrice: 0,
      expiryDate: '',
      batchNumber: '',
      gstRate: 0,
      hsnCode: ''
    });
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateGrandTotal = () => {
    const itemsTotal = items.reduce((sum, item) => sum + item.total, 0);
    return itemsTotal + transportCharges + otherCharges;
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      enqueueSnackbar('Please add at least one item', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      const purchaseData = {
        supplier: supplier._id,
        purchaseNumber,
        purchaseDate,
        items: items.map(item => ({
          product: item.id,
          quantity: item.quantity,
          weight: item.weight,
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice,
          total: item.total,
          type: item.type,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          gstRate: item.gstRate,
          hsnCode: item.hsnCode
        })),
        paymentType,
        paidAmount: paymentType === 'payment' ? paidAmount : 0,
        paymentAccount: paymentType === 'payment' ? selectedAccount : null,
        transportCharges,
        otherCharges,
        billNumber,
        totalAmount: calculateGrandTotal(),
        status: 'completed'
      };

      const response = await purchaseServices.createPurchase(purchaseData);
      if (response.success) {
        enqueueSnackbar('Purchase recorded successfully', { variant: 'success' });
        onClose();
      }
    } catch (error) {
      console.error('Error creating purchase:', error);
      enqueueSnackbar('Failed to record purchase', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={isMobile}>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Record Purchase</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {/* Basic Purchase Info */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>Purchase Details</Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Purchase Number"
              value={purchaseNumber}
              disabled
              variant="outlined"
              InputProps={{
                readOnly: true,
                sx: { bgcolor: 'action.hover' }
              }}
              size={isMobile ? "small" : "medium"}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Purchase Date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size={isMobile ? "small" : "medium"}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Supplier Bill Number"
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
              size={isMobile ? "small" : "medium"}
            />
          </Grid>

          {/* Item Selection Section */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
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
                    }}
                    size={isMobile ? "small" : "medium"}
                  >
                    <MenuItem value="product">Product</MenuItem>
                    <MenuItem value="livestock">Livestock</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={8}>
                  <Autocomplete
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
                              {loading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                {selectedStock && (
                  <>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Quantity"
                        value={currentItem.quantity}
                        onChange={(e) => updateItemCalculations('quantity', parseInt(e.target.value))}
                        size={isMobile ? "small" : "medium"}
                        InputProps={{ inputProps: { min: 1 } }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Purchase Price"
                        value={currentItem.purchasePrice}
                        onChange={(e) => updateItemCalculations('purchasePrice', parseFloat(e.target.value))}
                        size={isMobile ? "small" : "medium"}
                        InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Selling Price"
                        value={currentItem.sellingPrice}
                        onChange={(e) => updateItemCalculations('sellingPrice', parseFloat(e.target.value))}
                        size={isMobile ? "small" : "medium"}
                        InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={3}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={addItemToList}
                        startIcon={<AddIcon />}
                        sx={{ height: '100%' }}
                      >
                        Add Item
                      </Button>
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>
          </Grid>

          {/* Items Table */}
          {items.length > 0 && (
            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <StyledTableCell>Item</StyledTableCell>
                      <StyledTableCell align="right">Quantity</StyledTableCell>
                      <StyledTableCell align="right">Purchase Price</StyledTableCell>
                      <StyledTableCell align="right">Selling Price</StyledTableCell>
                      <StyledTableCell align="right">Total</StyledTableCell>
                      <StyledTableCell align="center">Actions</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, index) => (
                      <StyledTableRow key={index}>
                        <StyledTableCell>{item.name}</StyledTableCell>
                        <StyledTableCell align="right">{item.quantity}</StyledTableCell>
                        <StyledTableCell align="right">₹{item.purchasePrice}</StyledTableCell>
                        <StyledTableCell align="right">₹{item.sellingPrice}</StyledTableCell>
                        <StyledTableCell align="right">₹{item.total}</StyledTableCell>
                        <StyledTableCell align="center">
                          <IconButton onClick={() => removeItem(index)} size="small">
                            <DeleteIcon />
                          </IconButton>
                        </StyledTableCell>
                      </StyledTableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}

          {/* Additional Charges */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Transport Charges"
              value={transportCharges}
              onChange={(e) => setTransportCharges(parseFloat(e.target.value) || 0)}
              size={isMobile ? "small" : "medium"}
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Other Charges"
              value={otherCharges}
              onChange={(e) => setOtherCharges(parseFloat(e.target.value) || 0)}
              size={isMobile ? "small" : "medium"}
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
            />
          </Grid>

          {/* Payment Details */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Payment Type"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              size={isMobile ? "small" : "medium"}
            >
              <MenuItem value="credit">Credit</MenuItem>
              <MenuItem value="payment">Payment</MenuItem>
            </TextField>
          </Grid>

          {paymentType === 'payment' && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Paid Amount"
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                size={isMobile ? "small" : "medium"}
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
            </Grid>
          )}

          {/* Grand Total Display */}
          <Grid item xs={12}>
            <Typography variant="h6" align="right">
              Grand Total: ₹{calculateGrandTotal()}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={loading || items.length === 0}
        >
          {loading ? <CircularProgress size={24} /> : 'Record Purchase'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePurchaseDialog; 