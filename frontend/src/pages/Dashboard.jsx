import { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  PieChart,
  Pets,
  Inventory2,
  AttachMoney,
} from '@mui/icons-material';
import { livestockService } from '../services/livestockService';
import { productService } from '../services/productService';
import { useLocation } from 'react-router-dom';

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="h6" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div">
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const location = useLocation();
  const [data, setData] = useState({
    livestock: [],
    products: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [livestockRes, productsRes] = await Promise.all([
          livestockService.getStats(),
          productService.getAll(),
        ]);

        console.log('Raw dashboard data:', { 
          livestock: livestockRes?.data, 
          products: productsRes?.data 
        });

        setData({
          livestock: Array.isArray(livestockRes?.data) ? livestockRes.data : [],
          products: Array.isArray(productsRes?.data) ? productsRes.data : [],
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          p: 3,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Safely calculate totals with null checks
  const totalLivestock = Array.isArray(data.livestock) 
    ? data.livestock.reduce((acc, item) => acc + (Number(item.totalCount) || 0), 0)
    : 0;

  const totalProducts = Array.isArray(data.products)
    ? data.products.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0)
    : 0;

  const getActiveStyle = (path) => {
    return location.pathname === path ? {
      backgroundColor: '#f3f4f6', // Light gray background for active tab
      borderRadius: '0.375rem', // Rounded corners
      color: '#4f46e5', // Indigo text for active state
    } : {};
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Livestock"
            value={totalLivestock}
            icon={<Pets color="primary" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={totalProducts}
            icon={<Inventory2 color="secondary" />}
          />
        </Grid>
      </Grid>

      {/* Detailed Statistics */}
      <Grid container spacing={3}>
        {/* Livestock Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Livestock Overview
              </Typography>
              {Array.isArray(data.livestock) && data.livestock.length > 0 ? (
                data.livestock.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography>
                      {item.type || item._id?.type} ({item.gender || item._id?.gender})
                    </Typography>
                    <Typography>{item.totalCount || 0}</Typography>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">No livestock data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Products Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Products Overview
              </Typography>
              {Array.isArray(data.products) && data.products.length > 0 ? (
                data.products.map((product, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography>{product.type}</Typography>
                    <Typography>
                      {product.quantity || 0} {product.unit}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">No products data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 