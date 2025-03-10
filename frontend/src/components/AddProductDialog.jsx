import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import * as productService from '../services/productService';
import { useSnackbar } from 'notistack';

const AddProductDialog = ({ open, onClose, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    currentStock: 0,
    rate: 0,
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
      onClose();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to add product', { variant: 'error' });
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      unit: '',
      currentStock: 0,
      rate: 0,
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
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="name"
                label="Product Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                name="currentStock"
                label="Initial Stock"
                value={formData.currentStock}
                onChange={handleChange}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                name="rate"
                label="Price"
                value={formData.rate}
                onChange={handleChange}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Add Product
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddProductDialog; 