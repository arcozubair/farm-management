import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Collapse,
  IconButton,
  Grid,
  CardHeader,
  Chip,
  Avatar,
  Stack,
  Divider,
  Tab,
  Tabs,
  styled,
  Container,
  LinearProgress
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import StockHistory from './StockHistory';
import * as productService from '../services/productService';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  background: theme.palette.background.paper,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
  },
}));

const StockChip = styled(Chip)(({ theme, stocklevel }) => ({
  borderRadius: '8px',
  padding: '0 8px',
  height: '28px',
  backgroundColor: 
    stocklevel === 'low' ? theme.palette.error.lighter :
    stocklevel === 'medium' ? theme.palette.warning.lighter :
    theme.palette.success.lighter,
  color: 
    stocklevel === 'low' ? theme.palette.error.darker :
    stocklevel === 'medium' ? theme.palette.warning.darker :
    theme.palette.success.darker,
  '& .MuiChip-label': {
    fontWeight: 600,
  },
}));

const MetricBox = styled(Box)(({ theme, color = 'primary' }) => ({
  padding: theme.spacing(2.5),
  borderRadius: theme.shape.borderRadius * 1.5,
  background: theme.palette[color].lighter,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 48,
  height: 48,
  backgroundColor: theme.palette.primary.main,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
}));

const ProductCard = ({ product }) => {
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [todayMetrics, setTodayMetrics] = useState({
    sales: 0,
    purchases: 0,
    collections: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTodayMetrics = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await productService.getDailyStockReport(today);
        const productReport = response.data.find(
          report => report.productId === product._id
        );
        if (productReport) {
          setTodayMetrics({
            sales: productReport.totalSales || 0,
            purchases: productReport.totalPurchases || 0,
            collections: productReport.totalCollections || 0
          });
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchTodayMetrics();
    }
  }, [open, product._id]);

  const getStockLevel = (stock) => {
    if (stock < 10) return 'low';
    if (stock < 30) return 'medium';
    return 'high';
  };

  return (
    <StyledCard>
      <CardHeader
        avatar={
          <StyledAvatar>
            <InventoryIcon />
          </StyledAvatar>
        }
        action={
          <IconButton 
            onClick={() => setOpen(!open)}
            sx={{ 
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.3s'
            }}
          >
            <KeyboardArrowDownIcon />
          </IconButton>
        }
        title={
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {product.name}
          </Typography>
        }
        subheader={
          <Stack direction="row" spacing={1} alignItems="center">
            <StockChip
              label={`${product.currentStock} ${product.unit}`}
              stocklevel={getStockLevel(product.currentStock)}
            />
            <Chip
              icon={<CurrencyRupeeIcon sx={{ fontSize: '1rem' }} />}
              label={product.price.toFixed(2)}
              size="small"
              variant="outlined"
              sx={{ borderRadius: '8px' }}
            />
          </Stack>
        }
      />

      <Collapse in={open} timeout="auto" unmountOnExit>
        {loading && <LinearProgress sx={{ mx: 2 }} />}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)} 
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 500,
                fontSize: '0.95rem'
              }
            }}
          >
            <Tab label="Today's Metrics" />
            <Tab label="Stock History" />
          </Tabs>
        </Box>

        <CardContent>
          {tabValue === 0 ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <MetricBox color="error">
                  <TrendingDownIcon color="error" sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Today's Sales
                    </Typography>
                    <Typography variant="h6" color="error.darker" sx={{ fontWeight: 600 }}>
                      {`${todayMetrics.sales} ${product.unit}`}
                    </Typography>
                  </Box>
                </MetricBox>
              </Grid>
              <Grid item xs={12}>
                <MetricBox color="success">
                  <ShoppingCartIcon color="success" sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Today's Purchases
                    </Typography>
                    <Typography variant="h6" color="success.darker" sx={{ fontWeight: 600 }}>
                      {`${todayMetrics.purchases} ${product.unit}`}
                    </Typography>
                  </Box>
                </MetricBox>
              </Grid>
              <Grid item xs={12}>
                <MetricBox color="info">
                  <TrendingUpIcon color="info" sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Today's Collections
                    </Typography>
                    <Typography variant="h6" color="info.darker" sx={{ fontWeight: 600 }}>
                      {`${todayMetrics.collections} ${product.unit}`}
                    </Typography>
                  </Box>
                </MetricBox>
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ mt: 2 }}>
              <StockHistory itemId={product._id} itemType="Product" />
            </Box>
          )}
        </CardContent>
      </Collapse>
    </StyledCard>
  );
};

const ProductList = ({ products }) => {
  return (
    <Container maxWidth="xl">
      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} md={6} key={product._id}>
            <ProductCard product={product} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ProductList;