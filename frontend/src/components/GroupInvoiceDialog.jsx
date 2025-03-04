import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Box,
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import * as productService from '../services/productService';
import * as saleServices from '../services/saleServices';

const GroupInvoiceDialog = ({ open, onClose, customers }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const [milkRate, setMilkRate] = useState(0);
  const [milkStock, setMilkStock] = useState(0);
  const [remainingStock, setRemainingStock] = useState(0);

  const formik = useFormik({
    initialValues: {
      entries: customers.map(customer => ({
        customerId: customer._id,
        customerName: customer.name,
        quantity: '',
        rate: milkRate,
        total: 0
      }))
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      entries: Yup.array().of(
        Yup.object({
          quantity: Yup.number()
            .min(0, 'Must be 0 or greater')
            .typeError('Must be a number'),
          rate: Yup.number().required('Required')
        })
      )
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);
        setError('');
        
        // Filter out entries with zero or no quantity
        const validEntries = values.entries.filter(entry => 
            entry.quantity && parseFloat(entry.quantity) > 0
        );
        
        if (validEntries.length === 0) {
            setError('Please enter at least one valid quantity');
            return;
        }

        // Get milk product details from stock items
        const response = await productService.getAllProducts();
        const milkProduct = response.data.find(p => 
            p.type.toLowerCase().includes('milk')
        );

        if (!milkProduct) {
            setError('Milk product not found');
            return;
        }

        // Create array of invoice data only for customers with quantity > 0
        const invoicesData = validEntries.map(entry => ({
            customer: entry.customerId,
            invoiceDate: new Date().toISOString().split('T')[0],
            items: [{
                itemId: milkProduct._id,
                itemType: 'Product',
                name: 'Milk',
                quantity: parseFloat(entry.quantity),
                price: parseFloat(entry.rate),
                total: entry.total,
                unit: 'L',
                weight: 0
            }],
            grandTotal: entry.total
        }));

        // Send array of invoices directly to the createInvoice endpoint
        const result = await saleServices.createInvoice(invoicesData);
        
        if (result.success) {
          enqueueSnackbar('Invoices created successfully', { variant: 'success' });
        resetForm()

          onClose();
        } else {
          setError('Failed to create invoices');
        }
      } catch (err) {
        setError(err.message || 'Failed to create invoices');
      } finally {
        setLoading(false);
      }
    }
  });

  // Fetch milk rate and stock when dialog opens
  useEffect(() => {
    const fetchMilkData = async () => {
      try {
        const response = await productService.getAllProducts();
        const milkProduct = response.data.find(p => 
          p.type.toLowerCase().includes('milk')
        );
        if (milkProduct) {
          setMilkRate(milkProduct.price || 0);
          setMilkStock(milkProduct.currentStock || 0);
          setRemainingStock(milkProduct.currentStock || 0);
        }
      } catch (err) {
        console.error('Error fetching milk data:', err);
        setError('Failed to fetch milk data');
      }
    };

    if (open) {
      fetchMilkData();
    }
  }, [open]);

  // Calculate remaining stock in real-time
  useEffect(() => {
    const totalQuantity = formik.values.entries.reduce(
      (sum, entry) => sum + (parseFloat(entry.quantity) || 0),
      0
    );
    setRemainingStock(milkStock - totalQuantity);
  }, [formik.values.entries, milkStock]);

  // Update all rates when milk rate changes
  useEffect(() => {
    formik.values.entries.forEach((_, index) => {
      formik.setFieldValue(`entries.${index}.rate`, milkRate);
      // Recalculate total if quantity exists
      const quantity = formik.values.entries[index].quantity;
      if (quantity) {
        formik.setFieldValue(`entries.${index}.total`, quantity * milkRate);
      }
    });
  }, [milkRate]);

  const handleQuantityChange = (index, value) => {
    const numericValue = value === '' ? '' : parseFloat(value);
    const rate = formik.values.entries[index].rate || 0;
    
    // Calculate total quantity including this change
    const totalQuantity = formik.values.entries.reduce((sum, entry, i) => {
      if (i === index) {
        return sum + (numericValue || 0);
      }
      return sum + (parseFloat(entry.quantity) || 0);
    }, 0);

    // Check if we have enough stock
    if (totalQuantity > milkStock) {
      setError(`Not enough stock. Available: ${milkStock}L`);
      return;
    }

    setError(''); // Clear error if stock is sufficient
    formik.setFieldValue(`entries.${index}.quantity`, numericValue);
    formik.setFieldValue(`entries.${index}.total`, calculateTotal(numericValue, rate));
  };

  const handleRateChange = (index, value) => {
    const quantity = formik.values.entries[index].quantity || 0;
    formik.setFieldValue(`entries.${index}.rate`, value);
    formik.setFieldValue(`entries.${index}.total`, quantity * value);
  };

  const calculateTotal = (quantity, rate) => {
    if (!quantity || !rate) return 0;
    return parseFloat(quantity) * parseFloat(rate);
  };

  const getTotalQuantity = () => {
    return formik.values.entries.reduce((sum, entry) => sum + (parseFloat(entry.quantity) || 0), 0);
  };

  const getTotalAmount = () => {
    return formik.values.entries.reduce((sum, entry) => sum + (entry.total || 0), 0);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography>Create Group Milk Invoices</Typography>
          <Typography variant="subtitle2" color="primary">
            Available Stock: {remainingStock.toFixed(2)}L
          </Typography>
        </Box>
      </DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Quantity (L)</TableCell>
                  <TableCell>Rate (₹)</TableCell>
                  <TableCell>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formik.values.entries.map((entry, index) => (
                  <TableRow 
                    key={entry.customerId}
                    sx={{
                      backgroundColor: entry.quantity > 0 ? 'rgba(76, 175, 80, 0.1)' : 'inherit'
                    }}
                  >
                    <TableCell>{entry.customerName}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={entry.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        error={formik.touched.entries?.[index]?.quantity && Boolean(formik.errors.entries?.[index]?.quantity)}
                        helperText={formik.touched.entries?.[index]?.quantity && formik.errors.entries?.[index]?.quantity}
                        size="small"
                        inputProps={{
                          min: 0,
                          max: remainingStock + (parseFloat(entry.quantity) || 0), // Allow current quantity plus remaining
                          step: 0.1
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={entry.rate}
                       
                        size="small"
                      />
                    </TableCell>
                    <TableCell>₹{entry.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
                  <TableCell colSpan={2} align="right">
                    <strong>Totals</strong>
                  </TableCell>
                  <TableCell>{getTotalQuantity().toFixed(2)} L</TableCell>
                  <TableCell>₹{getTotalAmount().toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Stock Summary */}
          <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Typography color="text.secondary">
              Initial Stock: {milkStock.toFixed(2)}L
            </Typography>
            <Typography color="text.secondary">
              Used: {(milkStock - remainingStock).toFixed(2)}L
            </Typography>
            <Typography 
              color={remainingStock < 0 ? "error" : "primary"}
              fontWeight="bold"
            >
              Remaining: {remainingStock.toFixed(2)}L
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || remainingStock < 0 || getTotalQuantity() === 0}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Invoices'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default GroupInvoiceDialog; 