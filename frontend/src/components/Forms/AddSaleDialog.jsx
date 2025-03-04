import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Grid,
  Typography,
  Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import productService from '../../services/productService';
import livestockService from '../../services/livestockService';

const validationSchema = Yup.object({
  customer: Yup.string().required('Customer is required'),
  items: Yup.array().of(
    Yup.object().shape({
      itemType: Yup.string().required('Item type is required'),
      itemId: Yup.string().required('Item is required'),
      quantity: Yup.number().required('Quantity is required').min(1, 'Minimum quantity is 1'),
      price: Yup.number().required('Price is required').min(0, 'Price cannot be negative'),
    })
  ),
  paidAmount: Yup.number().min(0, 'Paid amount cannot be negative'),
});

const AddSaleDialog = ({ open, onClose, onSubmit, customers }) => {
  const [products, setProducts] = useState([]);
  const [livestock, setLivestock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const [productsData, livestockData] = await Promise.all([
          productService.getAllProducts(),
          livestockService.getAllLivestock()
        ]);
        setProducts(productsData.data);
        setLivestock(livestockData.data);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchItems();
    }
  }, [open]);

  const formik = useFormik({
    initialValues: {
      customer: '',
      items: [{
        itemType: 'Product',
        itemId: '',
        name: '',
        quantity: 1,
        price: 0,
        total: 0
      }],
      paidAmount: 0,
      grandTotal: 0
    },
    validationSchema,
    onSubmit: (values) => {
      onSubmit(values);
    }
  });

  const handleItemTypeChange = (index, value) => {
    const newItems = [...formik.values.items];
    newItems[index] = {
      ...newItems[index],
      itemType: value,
      itemId: '',
      price: 0,
      name: ''
    };
    formik.setFieldValue('items', newItems);
  };

  const handleItemChange = (index, value) => {
    const newItems = [...formik.values.items];
    const selectedItem = formik.values.items[index].itemType === 'Product'
      ? products.find(p => p._id === value)
      : livestock.find(l => l._id === value);

    if (selectedItem) {
      newItems[index] = {
        ...newItems[index],
        itemId: selectedItem._id,
        name: selectedItem.name || selectedItem.type,
        price: selectedItem.price,
        total: selectedItem.price * newItems[index].quantity
      };
    }
    formik.setFieldValue('items', newItems);
    calculateGrandTotal(newItems);
  };

  const calculateGrandTotal = (items) => {
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    formik.setFieldValue('grandTotal', total);
  };

  const addItem = () => {
    formik.setFieldValue('items', [...formik.values.items, {
      itemType: 'Product',
      itemId: '',
      name: '',
      quantity: 1,
      price: 0,
      total: 0
    }]);
  };

  const removeItem = (index) => {
    const newItems = formik.values.items.filter((_, i) => i !== index);
    formik.setFieldValue('items', newItems);
    calculateGrandTotal(newItems);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add New Sale</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            {/* Customer Selection */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Customer"
                name="customer"
                value={formik.values.customer}
                onChange={formik.handleChange}
                error={formik.touched.customer && Boolean(formik.errors.customer)}
                helperText={formik.touched.customer && formik.errors.customer}
              >
                {customers.map((customer) => (
                  <MenuItem key={customer._id} value={customer._id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Items */}
            {formik.values.items.map((item, index) => (
              <Grid container item spacing={2} key={index}>
                <Grid item xs={2}>
                  <TextField
                    fullWidth
                    select
                    label="Type"
                    value={item.itemType}
                    onChange={(e) => handleItemTypeChange(index, e.target.value)}
                  >
                    <MenuItem value="Product">Product</MenuItem>
                    <MenuItem value="Livestock">Livestock</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    select
                    label="Item"
                    value={item.itemId}
                    onChange={(e) => handleItemChange(index, e.target.value)}
                  >
                    {item.itemType === 'Product' 
                      ? products.map((product) => (
                          <MenuItem key={product._id} value={product._id}>
                            {product.name}
                          </MenuItem>
                        ))
                      : livestock.map((animal) => (
                          <MenuItem key={animal._id} value={animal._id}>
                            {animal.type} ({animal.category})
                          </MenuItem>
                        ))
                    }
                  </TextField>
                </Grid>

                <Grid item xs={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Quantity"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...formik.values.items];
                      newItems[index] = {
                        ...newItems[index],
                        quantity: Number(e.target.value),
                        total: Number(e.target.value) * item.price
                      };
                      formik.setFieldValue('items', newItems);
                      calculateGrandTotal(newItems);
                    }}
                  />
                </Grid>

                <Grid item xs={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Price"
                    value={item.price}
                    onChange={(e) => {
                      const newItems = [...formik.values.items];
                      newItems[index] = {
                        ...newItems[index],
                        price: Number(e.target.value),
                        total: Number(e.target.value) * item.quantity
                      };
                      formik.setFieldValue('items', newItems);
                      calculateGrandTotal(newItems);
                    }}
                  />
                </Grid>

                <Grid item xs={2}>
                  <TextField
                    fullWidth
                    disabled
                    label="Total"
                    value={item.quantity * item.price}
                  />
                </Grid>

                <Grid item xs={1}>
                  <IconButton 
                    onClick={() => removeItem(index)}
                    disabled={formik.values.items.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Button startIcon={<AddIcon />} onClick={addItem}>
                Add Item
              </Button>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Paid Amount"
                name="paidAmount"
                value={formik.values.paidAmount}
                onChange={formik.handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6">
                Grand Total: {formik.values.grandTotal}
              </Typography>
              <Typography>
                Remaining: {formik.values.grandTotal - formik.values.paidAmount}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Create Sale
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddSaleDialog; 