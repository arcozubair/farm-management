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
  tableCellClasses
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { styled } from '@mui/material/styles';
import * as productService from '../services/productService';
import * as livestockService from '../services/livestockService';
import CloseIcon from '@mui/icons-material/Close';
import useResponsiveness from '../hooks/useResponsive';
import * as invoiceService from '../services/saleServices';
import { useSnackbar } from 'notistack';
import * as companySettingsService from '../services/companySettingsService';


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
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [error, setError] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const { isMobile, isTablet } = useResponsiveness();

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

  useEffect(() => {
    const fetchStock = async () => {
      setLoading(true);
      setError('');
      try {
        const [productsResponse, livestockResponse] = await Promise.all([
          productService.getAllProducts(),
          livestockService.getAllLivestock()
        ]);

        const productsArray = productsResponse?.data || [];
        const livestockArray = livestockResponse?.data?.data || [];
        
        const combinedStock = [
          ...productsArray.map(p => ({ 
            ...p,
            name: p.type,
            price: p.price || 0,
            type: 'product',
            remainingStock: p.currentStock,
            unit: p.type.toLowerCase().includes('milk') ? 'L' : 'pcs'
          })),
          ...livestockArray.map(l => ({ 
            ...l,
            name: `${l.category} - ${l.type}`,
            price: l.price || 0,
            type: 'livestock',
            remainingStock: l.quantity,
            unit: l.weight > 0 ? 'kg' : 'pcs'
          }))
        ];
        
        setStockItems(combinedStock);
      } catch (error) {
        setError('Failed to fetch stock items. Please try again.');
        console.error('Error fetching stock:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchStock();
    }
  }, [open]);

  useEffect(() => {
    const fetchInvoiceNumber = async () => {
      try {
        const response = await companySettingsService.getNextInvoiceNumber();
        if (response.success) {
          setInvoiceNumber(response.data.nextInvoiceNumber);
        }
        console.log(response.data.nextInvoiceNumber);
      } catch (error) {
        console.error('Error fetching invoice number:', error);
        enqueueSnackbar('Failed to fetch invoice number', { variant: 'error' });
      }
    };

    if (open) {
      fetchInvoiceNumber();
    }
  }, [open]);

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

  const handleCreateInvoice = async () => {
    setLoading(true);
    setError('');

    try {
      const invoiceItems = items.map(item => ({
        itemId: item.productId,
        itemType: item.type === 'product' ? 'Product' : 'Livestock',
        name: item.name,
        quantity: Number(item.quantity),
        price: Number(item.rate),
        total: Number(item.total),
        weight: Number(item.weight || 0),
        unit: item.weight > 0 ? 'kg' : (item.name.toLowerCase().includes('milk') ? 'L' : 'pcs')
      }));

      const invoiceData = {
        customer: customer._id,
        items: invoiceItems,
        grandTotal: Number(calculateGrandTotal()),
        invoiceDate: invoiceDate,
        whatsappNotification: customer.whatsappNotification
      };

      const response = await invoiceService.createInvoice(invoiceData);
      
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
    } finally {
      setLoading(false);
    }
  };

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
            Create Invoice - {customer?.name}
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
              label="Invoice Number"
              value={invoiceNumber}
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
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Customer Name"
              value={customer?.name || ''}
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
              value={customer?.contactNumber || ''}
              disabled
              variant="outlined"
              InputProps={{
                readOnly: true,
                sx: { bgcolor: 'action.hover' }
              }}
            />
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Add Items
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={stockItems}
                  getOptionLabel={(option) => `${option.name} (Stock: ${option.remainingStock})`}
                  fullWidth
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Select Item"
                      ref={itemInputRef}
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                  onChange={handleItemSelect}
                  value={selectedStock}
                  isOptionEqualToValue={(option, value) => option.name === value.name}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={currentItem.quantity}
                  onChange={(e) => updateItemCalculations('quantity', parseFloat(e.target.value))}
                  inputProps={{ 
                    min: 1, 
                    max: currentItem.remainingStock 
                  }}
                  size={isMobile ? "small" : "medium"}
                  helperText="Used if no weight provided"
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  label="Weight (kg)"
                  type="number"
                  value={currentItem.weight}
                  onChange={(e) => updateItemCalculations('weight', parseFloat(e.target.value))}
                  inputProps={{ 
                    min: 0, 
                    step: 0.1 
                  }}
                  size={isMobile ? "small" : "medium"}
                  helperText={currentItem.weight > 0 ? "Total weight (prioritized)" : "Optional"}
                />
              </Grid>
           
              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  label="Rate"
                  type="number"
                  value={currentItem.rate}
                  onChange={(e) => updateItemCalculations('rate', parseFloat(e.target.value))}
                  inputProps={{ min: 0 }}
                  size={isMobile ? "small" : "medium"}
                  helperText={currentItem.weight > 0 ? "Per kg" : "Per unit"}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  label="Total"
                  type="number"
                  value={currentItem.total}
                  disabled
                  InputProps={{ readOnly: true }}
                  size={isMobile ? "small" : "medium"}
                  helperText={currentItem.weight > 0 ? "Weight × Rate" : "Quantity × Rate"}
                />
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton 
                  color="primary" 
                  onClick={handleAddItem}
                  disabled={!selectedStock || (!currentItem.quantity && !currentItem.weight) || !currentItem.rate}
                  size={isMobile ? "small" : "medium"}
                >
                  <AddIcon />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>

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
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          color="primary"
          disabled={items.length === 0 || loading}
          onClick={handleCreateInvoice}
        >
          {loading ? <CircularProgress size={24} /> : 'Create Invoice'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateInvoiceDialog; 