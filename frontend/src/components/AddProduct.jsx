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
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import * as productService from '../services/productService';
import { useSnackbar } from 'notistack';

const AddProduct = ({ open, onClose, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: '',
    currentStock: 0,
    price: 0,
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await productService.createProduct(formData);
      enqueueSnackbar('Product added successfully', { variant: 'success' });
      onSuccess();
      handleReset();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to add product', { variant: 'error' });
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      category: '',
      unit: '',
      currentStock: 0,
      price: 0,
      description: ''
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          Add New Product
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Product Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            margin="normal"
            required
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Unit</InputLabel>
            <Select
              name="unit"
              value={formData.unit}
              label="Unit"
              onChange={handleChange}
            >
              <MenuItem value="litre">Litre</MenuItem>
              <MenuItem value="kg">Kilogram</MenuItem>
              <MenuItem value="gram">Gram</MenuItem>
              <MenuItem value="dozen">Dozen</MenuItem>
              <MenuItem value="piece">Piece</MenuItem>
              <MenuItem value="packet">Packet</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Initial Stock"
            name="currentStock"
            type="number"
            value={formData.currentStock}
            onChange={handleChange}
            margin="normal"
            inputProps={{ min: 0 }}
          />

          <TextField
            fullWidth
            label="Price"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            margin="normal"
            required
            inputProps={{ min: 0, step: 0.01 }}
          />

          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={3}
          />

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="button"
              variant="outlined"
              onClick={onClose}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
            >
              Add Product
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AddProduct; 