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
  Tooltip,
  useMediaQuery
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import EggIcon from '@mui/icons-material/EggAlt';
import ProductList from '../components/ProductList';
import CategoryIcon from '@mui/icons-material/Category';
import  * as  productService  from '../services/productService';
import { useSnackbar } from 'notistack';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import PriceManagementDialog from '../components/PriceManagementDialog';

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
  const [openPriceDialog, setOpenPriceDialog] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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



  const handleUpdatePrices = async (prices) => {
    try {
      setLoading(true);
      await productService.updateProductPrices(prices);
      // Refresh the products list
      await fetchProducts();
      enqueueSnackbar('Prices updated successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error updating prices:', error);
      enqueueSnackbar(error.message || 'Failed to update prices', { variant: 'error' });
    } finally {
      setLoading(false);
    }
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
      <Container maxWidth="xl" sx={{ p: isMobile ? 1 : 3 }}>
        {/* Header Section */}
        <Card sx={{ p: isMobile ? 1 : 3, mb: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'row',
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: isMobile ? 1 : 3,
            gap: isMobile ? 1 : 2
          }}>
            <Typography 
              variant={isMobile ? "h6" : "h4"}
              sx={{ 
                fontWeight: 600,
                color: 'primary.main',
              }}
            >
              {isMobile ? "Products" : "Product Management"}
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              flexShrink: 0
            }}>
              <Tooltip title="Refresh">
                <IconButton
                  onClick={handleRefresh}
                  size="small"
                  sx={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'background.paper',
                    boxShadow: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <RefreshIcon 
                    fontSize="small" 
                    sx={{ 
                      animation: refreshing ? 'spin 1s linear infinite' : 'none' 
                    }} 
                  />
                </IconButton>
              </Tooltip>
              <Tooltip title="Manage Prices">
                <IconButton
                  onClick={() => setOpenPriceDialog(true)}
                  size="small"
                  sx={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'background.paper',
                    boxShadow: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <CurrencyRupeeIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add Product">
                <IconButton
                  onClick={() => setOpenAddDialog(true)}
                  size="small"
                  sx={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    boxShadow: 1,
                    '&:hover': {
                      backgroundColor: 'primary.dark'
                    }
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Divider sx={{ mb: isMobile ? 1 : 3 }} />

          {/* Summary Cards */}
          <Grid container spacing={isMobile ? 1 : 3}>
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
                <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocalDrinkIcon sx={{ mr: 1, fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                    <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 500 }}>
                      Today's Milk Collection
                    </Typography>
                  </Box>
                  <Typography 
                    variant={isMobile ? "h5" : "h4"} 
                    sx={{ 
                      mt: 1,
                      fontWeight: 500
                    }}
                  >
                    {todayCollections.milk} L
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mt: 0.5, 
                      opacity: 0.9,
                      display: 'block'
                    }}
                  >
                    {new Date().toLocaleDateString('en-IN', { 
                      weekday: 'long', 
                      month: 'short', 
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
                <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EggIcon sx={{ mr: 1, fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                    <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 500 }}>
                      Today's Eggs Collection
                    </Typography>
                  </Box>
                  <Typography 
                    variant={isMobile ? "h5" : "h4"} 
                    sx={{ 
                      mt: 1,
                      fontWeight: 500
                    }}
                  >
                    {todayCollections.eggs} Pcs
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mt: 0.5, 
                      opacity: 0.9,
                      display: 'block'
                    }}
                  >
                    {new Date().toLocaleDateString('en-IN', { 
                      weekday: 'long', 
                      month: 'short', 
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
                <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CategoryIcon sx={{ mr: 1, fontSize: isMobile ? '1.2rem' : '1.5rem' }} />

                    <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 500 }}>
                      Total Products
                    </Typography>
                  </Box>
                  <Typography 
                    variant={isMobile ? "h5" : "h4"} 
                    sx={{ 
                      mt: 1,
                      fontWeight: 500
                    }}
                  >
                    {products.length}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mt: 0.5, 
                      opacity: 0.9,
                      display: 'block'
                    }}
                  >
                    Active products in inventory
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Card>

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
            bgcolor: 'background.paper',
            borderRadius: 2,
            p: isMobile ? 1 : 3,
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

        <PriceManagementDialog
          open={openPriceDialog}
          onClose={() => setOpenPriceDialog(false)}
          items={products}
          onUpdatePrices={handleUpdatePrices}
          type="Product"
        />
      </Container>
    </Fade>
  );
};

export default Products;