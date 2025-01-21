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
    }).format(Math.abs(amount));
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

  if (!summaryData) return null;

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
              Period: {formatDate(summaryData.period.from)} - {formatDate(summaryData.period.to)}
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
                <Typography variant="h6">{summaryData.customerInfo.name}</Typography>
                <Typography variant="body2">
                  Contact: {summaryData.customerInfo.contactNumber}
                </Typography>
                <Typography variant="body2">
                  Address: {summaryData.customerInfo.address}
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
                value={formatAmount(summaryData.balances.opening)}
              />
              <StatItem 
                label="Current Balance"
                value={formatAmount(summaryData.balances.current)}
              />
              <StatItem 
                label="Net Change"
                value={formatAmount(summaryData.balances.net)}
                color={summaryData.balances.net >= 0 ? 'success' : 'error'}
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
                value={summaryData.transactions.totalTransactions}
              />
              <StatItem 
                label="Total Amount"
                value={formatAmount(summaryData.transactions.totalAmount)}
              />
              <Divider />
              {Object.entries(summaryData.transactions.byMode).map(([mode, amount]) => (
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
                value={summaryData.invoices.totalInvoices}
              />
              <StatItem 
                label="Total Amount"
                value={formatAmount(summaryData.invoices.totalAmount)}
              />
            </SummaryCard>
          </Grid>

          {/* Products Summary Card */}
          {summaryData.products && (
            <Grid item xs={12} md={6}>
              <SummaryCard 
                title="Products Summary" 
                icon={<ShoppingBasketIcon color="primary" />}
                color="primary"
              >
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Amount: {formatAmount(summaryData.products.totalAmount)}
                  </Typography>
                </Box>
                
                <Stack spacing={2}>
                  {/* Milk */}
                  {summaryData.products.products.milk.quantity > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="primary">
                        <WaterDropIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Milk
                      </Typography>
                      <StatItem 
                        label="Quantity"
                        value={summaryData.products.products.milk.quantity}
                        unit="L"
                      />
                      <StatItem 
                        label="Amount"
                        value={formatAmount(summaryData.products.products.milk.amount)}
                      />
                    </Box>
                  )}

                  {/* Eggs */}
                  {summaryData.products.products.eggs.quantity > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="primary">
                        <EggIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Eggs
                      </Typography>
                      <StatItem 
                        label="Quantity"
                        value={summaryData.products.products.eggs.quantity}
                        unit="pcs"
                      />
                      <StatItem 
                        label="Amount"
                        value={formatAmount(summaryData.products.products.eggs.amount)}
                      />
                    </Box>
                  )}

                  {/* Other Products */}
                  {summaryData.products.products.other.quantity > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="primary">
                        Other Products
                      </Typography>
                      <StatItem 
                        label="Quantity"
                        value={summaryData.products.products.other.quantity}
                        unit="units"
                      />
                      <StatItem 
                        label="Amount"
                        value={formatAmount(summaryData.products.products.other.amount)}
                      />
                    </Box>
                  )}
                </Stack>
              </SummaryCard>
            </Grid>
          )}

          {/* Livestock Summary Card */}
          {summaryData.livestock && Object.keys(summaryData.livestock.items).length > 0 && (
            <Grid item xs={12} md={6}>
              <SummaryCard 
                title="Livestock Summary" 
                icon={<PetsIcon color="error" />}
                color="error"
              >
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Amount: {formatAmount(summaryData.livestock.totalAmount)}
                  </Typography>
                </Box>

                <Stack spacing={2}>
                  {Object.values(summaryData.livestock.items).map((item, index) => (
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