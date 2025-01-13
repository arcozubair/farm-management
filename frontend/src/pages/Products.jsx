import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card,
  CardContent,
  Divider,
  CircularProgress,
  useTheme,
  Container,
  Fade,
  IconButton,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import EggIcon from '@mui/icons-material/EggAlt';
import ProductList from '../components/ProductList';
import { productService } from '../services/productService';
import { useSnackbar } from 'notistack';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [todayCollections, setTodayCollections] = useState({
    milk: 0,
    eggs: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    fetchProducts();
    fetchTodayCollections();
  }, []);

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

  const fetchTodayCollections = async () => {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      console.log('Fetching collections for:', today);
      
      const response = await productService.getProductDetails(today);
      console.log('Received response:', response);
      
      if (response.success && response.data) {
        setTodayCollections({
          milk: response.data.milkCollection || 0,
          eggs: response.data.eggsCollection || 0
        });
      } else {
        console.error('Invalid response format:', response);
      }
    } catch (error) {
      console.error('Failed to fetch today\'s collections:', error);
      enqueueSnackbar('Failed to fetch today\'s collections', { variant: 'error' });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchTodayCollections()]);
    setRefreshing(false);
  };

  const getTotalStock = () => {
    return products.reduce((acc, product) => acc + product.currentStock, 0);
  };

  const getStockValue = () => {
    // Example price calculation - adjust according to your needs
    const prices = {
      milk: 50, // price per liter
      eggs: 6   // price per piece
    };
    
    return products.reduce((acc, product) => {
      return acc + (product.currentStock * prices[product.type]);
    }, 0);
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Fade in={!loading}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
            Product Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
                <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddDialog(true)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                boxShadow: 2
              }}
            >
              Add Product
            </Button>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card 
              elevation={2}
              sx={{ 
                bgcolor: theme.palette.primary.light,
                color: 'white',
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocalDrinkIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Today's Milk Collection
                  </Typography>
                </Box>
                <Typography variant="h3">
                  {todayCollections.milk} L
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                  {new Date().toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card 
              elevation={2}
              sx={{ 
                bgcolor: theme.palette.secondary.light,
                color: 'white',
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EggIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Today's Eggs Collection
                  </Typography>
                </Box>
                <Typography variant="h3">
                  {todayCollections.eggs} Pcs
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                  {new Date().toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card 
              elevation={2}
              sx={{ 
                bgcolor: theme.palette.success.light,
                color: 'white',
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Products
                </Typography>
                <Typography variant="h3">
                  {products.length}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                  Active products in inventory
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Divider with label */}
        <Box sx={{ mb: 4 }}>
          <Divider>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: theme.palette.text.secondary,
                px: 2
              }}
            >
              Product List
            </Typography>
          </Divider>
        </Box>

        {/* Product List */}
        <Box 
          sx={{ 
            bgcolor: theme.palette.background.paper,
            borderRadius: 2,
            p: 3,
            boxShadow: 1
          }}
        >
          <ProductList 
            products={products} 
            loading={loading}
            onProductUpdate={fetchProducts}
          />
        </Box>

        {/* Add Product Dialog - You can keep your existing dialog component */}
        {/* {openAddDialog && (
          <AddProductDialog
            open={openAddDialog}
            onClose={() => setOpenAddDialog(false)}
            onSuccess={() => {
              setOpenAddDialog(false);
              fetchProducts();
            }}
          />
        )} */}
      </Container>
    </Fade>
  );
};

export default Products;