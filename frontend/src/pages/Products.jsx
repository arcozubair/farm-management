import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { productService } from '../services/productService';
import DataTable from '../components/DataTable';
import { useSnackbar } from 'notistack';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  const columns = [
    { field: 'type', headerName: 'Type', flex: 1 },
    { field: 'quantity', headerName: 'Quantity', flex: 1 },
    { field: 'unit', headerName: 'Unit', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params) => (
        <Button
          size="small"
          onClick={() => handleUpdateStock(params.row)}
        >
          Update Stock
        </Button>
      ),
    },
  ];

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAll();
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (productData) => {
    try {
      await createProduct(productData);
      enqueueSnackbar('Product added successfully!', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to add product', { variant: 'error' });
    }
  };

  const handleUpdateStock = async (productId, quantity) => {
    try {
      await updateProductStock(productId, quantity);
      enqueueSnackbar('Stock updated successfully!', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to update stock', { variant: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Products Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => console.log('Add product')}
        >
          Add Product
        </Button>
      </Box>

      <DataTable
        rows={products}
        columns={columns}
        loading={loading}
      />
    </Box>
  );
};

export default Products; 