// GroupSalesDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import * as productService from '../../services/productService';
import * as saleServices from '../../services/saleServices';
import accountService from '../../services/accountService';
import { getNextSaleNumber } from '../../services/companySettingsService';
import { useSnackbar } from 'notistack';
import useResponsiveness from '../../hooks/useResponsive';

const GroupSalesDialog = ({ open, onClose }) => {
  const [sales, setSales] = useState([]);
  const [milkProduct, setMilkProduct] = useState(null);
  const [availableMilkQty, setAvailableMilkQty] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [baseSaleNumber, setBaseSaleNumber] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const { isMobile, isTablet } = useResponsiveness();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsRes, customersRes, settingsRes] = await Promise.all([
          productService.getAllProducts(),
          accountService.getAccounts({ accountType: 'Customer' }),
          getNextSaleNumber()
        ]);

        const productsData = Array.isArray(productsRes) ? productsRes : productsRes?.data || [];
        const milk = productsData.find(p => p.name.toLowerCase() === 'milk');
        if (!milk) throw new Error('Milk product not found');
        setMilkProduct(milk);
        setAvailableMilkQty(milk.currentStock);

        const customersData = customersRes?.data || [];
        setCustomers(customersData);

        const nextSaleNumber = settingsRes?.data?.nextSaleNumber; // e.g., "SALE-25/03-00073"
        if (!nextSaleNumber) throw new Error('Failed to fetch next sale number');
        setBaseSaleNumber(nextSaleNumber);

        const match = nextSaleNumber.match(/(\d+)$/);
        const baseNumber = match ? parseInt(match[0], 10) : 0;
        const prefix = nextSaleNumber.replace(/\d+$/, '');

        const initialSales = customersData.map((customer, index) => ({
          customer,
          quantity: 0,
          rate: milk.rate || 0,
          total: 0,
          saleNumber: `${prefix}${String(baseNumber + index).padStart(5, '0')}`
        }));
        setSales(initialSales);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    if (open) fetchData();
  }, [open]);

  const updateSaleEntry = (index, field, value) => {
    const newSales = [...sales];
    if (field === 'quantity') {
      const newQty = parseInt(value) || 0;
      const totalQtyBefore = sales.reduce((sum, sale, i) => sum + (i !== index ? sale.quantity : 0), 0);
      const availableAfter = milkProduct.currentStock - totalQtyBefore;

      if (newQty > availableAfter) {
        setError(`Cannot exceed available milk quantity: ${availableAfter} L`);
        return;
      }
      newSales[index].quantity = newQty;
      setError('');
    } else if (field === 'rate') {
      newSales[index].rate = parseFloat(value) || 0;
    }
    newSales[index].total = (newSales[index].quantity * newSales[index].rate).toFixed(2);
    setSales(newSales);
    setAvailableMilkQty(milkProduct.currentStock - newSales.reduce((sum, sale) => sum + sale.quantity, 0));
  };

  const removeSaleEntry = (index) => {
    const newSales = sales.filter((_, i) => i !== index);
    setSales(newSales);
    setAvailableMilkQty(milkProduct.currentStock - newSales.reduce((sum, sale) => sum + sale.quantity, 0));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const validSales = sales.filter(sale => sale.quantity > 0);
      if (validSales.length === 0) {
        throw new Error('No valid sales to process (all quantities are 0)');
      }

      const totalQty = validSales.reduce((sum, sale) => sum + sale.quantity, 0);
      if (totalQty > milkProduct.currentStock) {
        throw new Error(`Total quantity (${totalQty} L) exceeds available milk (${milkProduct.currentStock} L)`);
      }

      const saleData = validSales.map(sale => ({
        customer: sale.customer._id,
        items: [{
          itemId: milkProduct._id,
          itemType: 'Product',
          name: 'Milk',
          quantity: sale.quantity,
          rate: sale.rate,
          total: sale.total,
          unit: 'L'
        }],
        grandTotal: sale.total,
        saleNumber: sale.saleNumber,
        date: new Date().toISOString(),
        paymentType: 'credit'
      }));

      const response = await saleServices.createMultipleSales(saleData);

      if (response.success) {
        enqueueSnackbar(`Created ${validSales.length} milk sales successfully`, { variant: 'success' });
        onClose();
      } else {
        throw new Error(response.message || 'Failed to create bulk sales');
      }
    } catch (err) {
      setError(err.message || 'Failed to create bulk sales');
      enqueueSnackbar(err.message || 'Failed to create bulk sales', { variant: 'error' });
    } finally {
      setLoading(false);
      resetForm();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={isMobile ? 'xs' : 'md'} 
      fullWidth
      PaperProps={{ 
        sx: { 
          width: isMobile ? '90vw' : 'auto', // Increase width on mobile
          maxWidth: isMobile ? 'none' : 'md',
          m: isMobile ? 1 : 2 // Adjust margin for mobile
        } 
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant={isMobile ? 'h6' : 'h5'}>Bulk Milk Sales (Credit)</Typography>
          <IconButton onClick={onClose} size={isMobile ? 'small' : 'medium'}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />}
        
        <Typography variant={isMobile ? 'body2' : 'subtitle1'} sx={{ mb: 2 }}>
          Available Milk: {availableMilkQty} L
        </Typography>

        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          {isMobile ? (
            // Mobile layout: Stack fields vertically
            sales.map((sale, index) => (
              <Box key={index} sx={{ mb: 2, p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                <Typography variant="subtitle2">{sale.customer.accountName}</Typography>
                <Grid container spacing={1} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <TextField
                      label="Qty (L)"
                      type="number"
                      value={sale.quantity}
                      onChange={(e) => updateSaleEntry(index, 'quantity', e.target.value)}
                      size="small"
                      fullWidth
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Rate (₹/L)"
                      type="number"
                      value={sale.rate}
                      onChange={(e) => updateSaleEntry(index, 'rate', e.target.value)}
                      size="small"
                      fullWidth
                      InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">Total: ₹{sale.total}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Sale #: {sale.saleNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => removeSaleEntry(index)}
                    >
                      Remove
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            ))
          ) : (
            // Desktop/Tablet layout: Table
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Quantity (L)</TableCell>
                  <TableCell align="right">Rate (₹/L)</TableCell>
                  <TableCell align="right">Total (₹)</TableCell>
                  <TableCell align="center">Sale Number</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sales.map((sale, index) => (
                  <TableRow key={index}>
                    <TableCell>{sale.customer.accountName}</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={sale.quantity}
                        onChange={(e) => updateSaleEntry(index, 'quantity', e.target.value)}
                        size="small"
                        InputProps={{ inputProps: { min: 0 } }}
                        sx={{ width: '80px' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={sale.rate}
                        onChange={(e) => updateSaleEntry(index, 'rate', e.target.value)}
                        size="small"
                        InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                        sx={{ width: '80px' }}
                      />
                    </TableCell>
                    <TableCell align="right">{sale.total}</TableCell>
                    <TableCell align="center">{sale.saleNumber}</TableCell>
                   
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 1 : 0 }}>
        <Button 
          onClick={onClose} 
          disabled={loading} 
          fullWidth={isMobile}
          size={isMobile ? 'small' : 'medium'}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading || sales.every(s => s.quantity === 0)}
          fullWidth={isMobile}
          size={isMobile ? 'small' : 'medium'}
        >
          {loading ? <CircularProgress size={24} /> : 'Create Bulk Sales'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GroupSalesDialog;