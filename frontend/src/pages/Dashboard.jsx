import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import CountUp from 'react-countup';
import { styled } from '@mui/material/styles';
import { 
  Pets, 
  EggAlt, 
  LocalDrink, 
  AttachMoney 
} from '@mui/icons-material';

// Modern styled components
const StyledCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 20,
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
  }
}));

const ChartContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 20,
  background: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  height: '100%',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
  }
}));

const StatCard = ({ title, value, unit, icon, color }) => (
  <StyledCard>
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
      <Box 
        sx={{ 
          p: 1.5, 
          borderRadius: 2, 
          backgroundColor: `${color}15`
        }}
      >
        {icon}
      </Box>
    </Box>
    <Typography variant="h6" color="text.secondary" gutterBottom>
      {title}
    </Typography>
    <Typography variant="h4" component="div" sx={{ color, fontWeight: 'bold' }}>
      <CountUp end={value} separator="," duration={2} />
      <Typography component="span" variant="h6" sx={{ ml: 1, opacity: 0.7 }}>
        {unit}
      </Typography>
    </Typography>
  </StyledCard>
);

const Dashboard = () => {
  const theme = useTheme();
  const [data, setData] = useState({
    totalMilk: 5000,
    totalEggs: 120,
    totalSheep: 200,
    totalSales: 57000,
    productionData: [
      { month: 'Jan', milk: 4200, eggs: 110 },
      { month: 'Feb', milk: 4500, eggs: 115 },
      { month: 'Mar', milk: 5000, eggs: 120 },
    ],
    salesData: [
      { month: 'Jan', revenue: 52000 },
      { month: 'Feb', revenue: 54000 },
      { month: 'Mar', revenue: 57000 },
    ]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ 
      p: 3,
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          mb: 4, 
          fontWeight: 'bold',
          color: theme.palette.text.primary,
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        Farm Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Milk"
            value={data.totalMilk}
            unit="L"
            icon={<LocalDrink sx={{ fontSize: 30, color: theme.palette.primary.main }} />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Eggs"
            value={data.totalEggs}
            unit="dozens"
            icon={<EggAlt sx={{ fontSize: 30, color: theme.palette.secondary.main }} />}
            color={theme.palette.secondary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Sheep Count"
            value={data.totalSheep}
            unit="animals"
            icon={<Pets sx={{ fontSize: 30, color: theme.palette.success.main }} />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sales"
            value={data.totalSales}
            unit="₹"
            icon={<AttachMoney sx={{ fontSize: 30, color: theme.palette.info.main }} />}
            color={theme.palette.info.main}
          />
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={8}>
          <ChartContainer>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Production Trends
            </Typography>
            <Box sx={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <LineChart data={data.productionData}>
                  <defs>
                    <linearGradient id="milk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="eggs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: 8,
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="milk" 
                    stroke={theme.palette.primary.main}
                    strokeWidth={3}
                    dot={{ stroke: theme.palette.primary.main, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 8 }}
                    name="Milk (L)"
                    fill="url(#milk)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="eggs" 
                    stroke={theme.palette.secondary.main}
                    strokeWidth={3}
                    dot={{ stroke: theme.palette.secondary.main, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 8 }}
                    name="Eggs (dozens)"
                    fill="url(#eggs)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </ChartContainer>
        </Grid>

        <Grid item xs={12} md={4}>
          <ChartContainer>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Sales Distribution
            </Typography>
            <Box sx={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <RePieChart>
                  <Pie
                    data={[
                      { name: 'Milk', value: data.totalMilk * 60 },
                      { name: 'Eggs', value: data.totalEggs * 7 },
                      { name: 'Livestock', value: data.totalSheep * 1000 }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                  >
                    {[
                      theme.palette.primary.main,
                      theme.palette.secondary.main,
                      theme.palette.success.main
                    ].map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: 8,
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </Box>
          </ChartContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 
