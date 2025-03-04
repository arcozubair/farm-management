import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  CircularProgress,
  Container,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import ProductList from '../components/ProductList';
import * as productService from '../services/productService';
import { useSnackbar } from 'notistack';
import AddProductDialog from '../components/AddProductDialog';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAllProducts();
      setProducts(response.data);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to fetch products', { 
        variant: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Products</Typography>
        <Box>
          <Tooltip title="Add Product">
            <IconButton onClick={() => setOpenAddDialog(true)} color="primary">
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <ProductList 
        products={products}
        loading={loading}
        onProductUpdate={fetchProducts}
      />

      <AddProductDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        onSuccess={() => {
          setOpenAddDialog(false);
          fetchProducts();
        }}
      />
    </Container>
  );
};

export default Products;