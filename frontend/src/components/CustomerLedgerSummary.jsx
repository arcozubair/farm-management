import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Divider,
  Stack,
  Chip,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import PetsIcon from '@mui/icons-material/Pets';
import EggIcon from '@mui/icons-material/EggAlt';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const SummaryCard = ({ title, icon, children, color = 'primary' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Stack spacing={2}>
        <Box display="flex" alignItems="center" gap={1}>
          {icon}
          <Typography variant="h6" color={`${color}.main`}>
            {title}
          </Typography>
        </Box>
        {children}
      </Stack>
    </CardContent>
  </Card>
);

const StatItem = ({ label, value, unit = '', color = 'default' }) => (
  <Box display="flex" justifyContent="space-between" alignItems="center">
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Chip
      label={`${value} ${unit}`.trim()}
      color={color}
      size="small"
      variant="outlined"
    />
  </Box>
);

const CustomerLedgerSummary = ({ open, onClose, summaryData, loading }) => {
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(Math.abs(amount || 0));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <Box display="flex" justifyContent="center" alignItems="center" p={3}>
          <CircularProgress />
        </Box>
      </Dialog>
    );
  }

  if (!summaryData || !summaryData.customerInfo) return null;

  const {
    period = { from: new Date(), to: new Date() },
    customerInfo = {},
    balances = { opening: 0, current: 0, net: 0 },
    transactions = { totalTransactions: 0, totalAmount: 0, byMode: {} },
    invoices = { totalInvoices: 0, totalAmount: 0 },
    products = {
      totalAmount: 0,
      products: {
        milk: { quantity: 0, amount: 0 },
        eggs: { quantity: 0, amount: 0 },
        other: { quantity: 0, amount: 0 }
      }
    },
    livestock = { totalAmount: 0, items: {} }
  } = summaryData;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: '80vh'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Stack>
            <Typography variant="h5" fontWeight="bold">
              Ledger Summary
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Period: {formatDate(period.from)} - {formatDate(period.to)}
            </Typography>
          </Stack>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Customer Info */}
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent>
                <Typography variant="h6">{customerInfo.name}</Typography>
                <Typography variant="body2">
                  Contact: {customerInfo.contactNumber}
                </Typography>
                <Typography variant="body2">
                  Address: {customerInfo.address}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Balance Summary */}
          <Grid item xs={12} md={4}>
            <SummaryCard 
              title="Balance Summary" 
              icon={<AccountBalanceWalletIcon color="primary" />}
            >
              <StatItem 
                label="Opening Balance"
                value={formatAmount(balances.opening)}
              />
              <StatItem 
                label="Current Balance"
                value={formatAmount(balances.current)}
              />
              <StatItem 
                label="Net Change"
                value={formatAmount(balances.net)}
                color={balances.net >= 0 ? 'success' : 'error'}
              />
            </SummaryCard>
          </Grid>

          {/* Transaction Summary */}
          <Grid item xs={12} md={4}>
            <SummaryCard 
              title="Transactions" 
              icon={<ReceiptIcon color="info" />}
              color="info"
            >
              <StatItem 
                label="Total Transactions"
                value={transactions.totalTransactions}
              />
              <StatItem 
                label="Total Amount"
                value={formatAmount(transactions.totalAmount)}
              />
              <Divider />
              {Object.entries(transactions.byMode).map(([mode, amount]) => (
                <StatItem 
                  key={mode}
                  label={mode.replace('_', ' ').toUpperCase()}
                  value={formatAmount(amount)}
                />
              ))}
            </SummaryCard>
          </Grid>

          {/* Invoice Summary */}
          <Grid item xs={12} md={4}>
            <SummaryCard 
              title="Invoices" 
              icon={<TrendingUpIcon color="success" />}
              color="success"
            >
              <StatItem 
                label="Total Invoices"
                value={invoices.count}
              />
              <StatItem 
                label="Total Amount"
                value={formatAmount(invoices.totalAmount)}
              />
            </SummaryCard>
          </Grid>

          {/* Products Summary Card */}
          {products && (
            <Grid item xs={12} md={6}>
              <SummaryCard 
                title="Products Summary" 
                icon={<ShoppingBasketIcon color="primary" />}
                color="primary"
              >
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Amount: {formatAmount(products.totalAmount)}
                  </Typography>
                </Box>
                
                <Stack spacing={2}>
                  {/* Milk */}
                  {products.products.milk.quantity > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="primary">
                        <WaterDropIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Milk
                      </Typography>
                      <StatItem 
                        label="Quantity"
                        value={products.products.milk.quantity}
                        unit="L"
                      />
                      <StatItem 
                        label="Amount"
                        value={formatAmount(products.products.milk.amount)}
                      />
                    </Box>
                  )}

                  {/* Eggs */}
                  {products.products.eggs.quantity > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="primary">
                        <EggIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Eggs
                      </Typography>
                      <StatItem 
                        label="Quantity"
                        value={products.products.eggs.quantity}
                        unit="pcs"
                      />
                      <StatItem 
                        label="Amount"
                        value={formatAmount(products.products.eggs.amount)}
                      />
                    </Box>
                  )}

                  {/* Other Products */}
                  {products.products.other.quantity > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="primary">
                        Other Products
                      </Typography>
                      <StatItem 
                        label="Quantity"
                        value={products.products.other.quantity}
                        unit="units"
                      />
                      <StatItem 
                        label="Amount"
                        value={formatAmount(products.products.other.amount)}
                      />
                    </Box>
                  )}
                </Stack>
              </SummaryCard>
            </Grid>
          )}

          {/* Livestock Summary Card */}
          {livestock && Object.keys(livestock.items).length > 0 && (
            <Grid item xs={12} md={6}>
              <SummaryCard 
                title="Livestock Summary" 
                icon={<PetsIcon color="error" />}
                color="error"
              >
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Amount: {formatAmount(livestock.totalAmount)}
                  </Typography>
                </Box>

                <Stack spacing={2}>
                  {Object.values(livestock.items).map((item, index) => (
                    <Box key={index}>
                      <Typography variant="subtitle2" color="error">
                        {item.name}
                      </Typography>
                      <StatItem 
                        label="Quantity"
                        value={item.quantity}
                        unit={item.unit}
                      />
                      <StatItem 
                        label="Amount"
                        value={formatAmount(item.amount)}
                      />
                    </Box>
                  ))}
                </Stack>
              </SummaryCard>
            </Grid>
          )}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerLedgerSummary; 