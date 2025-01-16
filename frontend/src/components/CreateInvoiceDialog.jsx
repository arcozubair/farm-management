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
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now()}`);
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
    remainingStock: 0
  });

  // Create ref for the Autocomplete input
  const autocompleteRef = React.useRef(null);

  // Add ref for the item Autocomplete
  const itemInputRef = React.useRef(null);

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
            remainingStock: p.currentStock
          })),
          ...livestockArray.map(l => ({ 
            ...l,
            name: `${l.category} - ${l.type}`,
            price: l.price || 0,
            type: 'livestock',
            remainingStock: l.quantity
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

  const validateItemInput = () => {
    if (!selectedStock) {
      setError('Please select an item');
      return false;
    }
    if (currentItem.quantity <= 0) {
      setError('Quantity must be greater than 0');
      return false;
    }
    if (currentItem.quantity > currentItem.remainingStock) {
      setError('Quantity cannot exceed available stock');
      return false;
    }
    if (currentItem.weight < 0) {
      setError('Weight cannot be negative');
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
      setSelectedStock(value);
      setCurrentItem({
        ...currentItem,
        name: value.name,
        rate: value.price || 0,
        type: value.type,
        remainingStock: value.remainingStock,
        total: (currentItem.quantity * (value.price || 0) ||  (currentItem.weight || 1))
      });
    }
  };

  const updateItemCalculations = (field, value) => {
    setCurrentItem(prev => {
      const updates = { ...prev, [field]: value };
      
      // Calculate total based on either quantity or weight
      if (field === 'quantity' || field === 'weight' || field === 'rate') {
        // If weight is greater than 0, use weight calculation
        if (updates.weight > 0) {
          updates.total = (updates.weight * updates.rate).toFixed(2);
          // Reset quantity when using weight
          updates.quantity = 1;
        } else {
          // Otherwise use quantity calculation
          updates.total = (updates.quantity * updates.rate).toFixed(2);
        }
      }
      
      return updates;
    });
  };

  const handleAddItem = () => {
    if (validateItemInput()) {
      setItems([...items, { ...currentItem, id: Date.now() }]);
      setSelectedStock(null);
      setCurrentItem({
        id: '',
        name: '',
        quantity: 1,
        weight: 0,
        rate: 0,
        total: 0,
        type: '',
        remainingStock: 0
      });
      setError('');
      
      // Focus back on the Autocomplete
      setTimeout(() => {
        if (autocompleteRef.current) {
          // Access the input element and focus it
          const input = autocompleteRef.current.getElementsByClassName('MuiInputBase-input')[0];
          if (input) {
            input.focus();
          }
        }
      }, 0);
    }
  };

  const handleRemoveItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + parseFloat(item.total), 0).toFixed(2);
  };

  const handleCreateInvoice = () => {
    if (items.length === 0) {
      setError('Please add at least one item to the invoice');
      return;
    }
    
    const invoiceData = {
      invoiceNumber,
      invoiceDate,
      customerId: customer.id,
      customerName: customer.name,
      items,
      total: calculateGrandTotal()
    };

    console.log('Invoice Data:', invoiceData);
    // Add your invoice creation API call here
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      fullScreen={isMobile}
      PaperProps={{ sx: { minHeight: '80vh' } }}
      TransitionProps={{
        onEntered: () => {
          if (itemInputRef.current) {
            const input = itemInputRef.current.querySelector('input');
            if (input) {
              input.focus();
            }
          }
        }
      }}
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
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Invoice Number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                disabled
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="date"
                label="Invoice Date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Box>

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
                disabled={currentItem.weight > 0} // Disable if weight is being used
                helperText={currentItem.weight > 0 ? "Using weight" : ""}
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
                helperText={currentItem.weight > 0 ? "Using weight for total" : "Optional"}
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