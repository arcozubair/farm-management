import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper
} from '@mui/material';
import { productService } from '../services/productService';

const AddProduct = () => {
  const [formData, setFormData] = useState({
    type: '',
    quantity: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user starts typing
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Basic validation
      if (!formData.type || !formData.quantity) {
        setError('Please fill in all fields');
        return;
      }

      const response = await productService.addProduct(formData);
      setSuccess('Product added successfully!');
      setFormData({ type: '', quantity: '' }); // Reset form
    } catch (err) {
      setError(err.message || 'Failed to add product');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Add New Product
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Product Type</InputLabel>
          <Select
            name="type"
            value={formData.type}
            label="Product Type"
            onChange={handleChange}
          >
            <MenuItem value="milk">Milk</MenuItem>
            <MenuItem value="eggs">Eggs</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Initial Quantity"
          name="quantity"
          type="number"
          value={formData.quantity}
          onChange={handleChange}
          sx={{ mb: 2 }}
        />

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {success && (
          <Typography color="success.main" sx={{ mb: 2 }}>
            {success}
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
        >
          Add Product
        </Button>
      </Box>
    </Paper>
  );
};

export default AddProduct; 