import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  TextField,
  IconButton,
  Tooltip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { DataGrid } from '@mui/x-data-grid';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { format } from 'date-fns';
import accountService from '../../services/accountService';
import MainLayout from '../../layouts/MainLayout';
import { useParams, useLocation } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const dateRanges = [
  { value: 'all_time', label: 'All Time' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom Date Range' }
];

const columns = [
  { 
    field: 'date', 
    headerName: 'Date', 
    flex: 0.8,
    minWidth: 80,
    valueFormatter: (params) => params.value ? format(new Date(params.value), 'dd/MM/yyyy') : '-'
  },
  { 
    field: 'particulars', 
    headerName: 'Particulars', 
    flex: 1.2,
    minWidth: 120,
    renderCell: (params) => (
      <Typography
        variant="body2"
        sx={{ 
          fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
          fontWeight: params.row.isOpening ? 600 : 400,
          color: params.row.isOpening ? 'primary.main' : 'text.primary'
        }}
      >
        {params.value}
      </Typography>
    )
  },
  { 
    field: 'dr', 
    headerName: 'DR', 
    flex: 0.8,
    minWidth: 70,
    align: 'right',
    headerAlign: 'right',
    renderCell: (params) => (
      <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>
        {params.value ? `₹${params.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
      </Typography>
    )
  },
  { 
    field: 'cr', 
    headerName: 'CR', 
    flex: 0.8,
    minWidth: 70,
    align: 'right',
    headerAlign: 'right',
    renderCell: (params) => (
      <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>
        {params.value ? `₹${params.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
      </Typography>
    )
  },
  { 
    field: 'balance', 
    headerName: 'Balance', 
    flex: 1,
    minWidth: 90,
    align: 'right',
    headerAlign: 'right',
    renderCell: (params) => (
      <Typography
        variant="body2"
        sx={{ 
          fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
          fontWeight: params.row.isOpening ? 600 : 400,
          color: params.value >= 0 ? 'success.main' : 'error.main'
        }}
      >
        ₹{Math.abs(params.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        <Typography component="span" variant="caption" sx={{ ml: 0.5, fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.75rem' } }}>
          {params.value >= 0 ? 'Dr' : 'Cr'}
        </Typography>
      </Typography>
    )
  }
];

const AccountLedger = () => {
  const { accountId } = useParams();
  const { state } = useLocation();
  const account = state?.account;
  
  const [dateRange, setDateRange] = useState('monthly');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accountData, setAccountData] = useState(account);
  const [openDateDialog, setOpenDateDialog] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(null);
  const [tempEndDate, setTempEndDate] = useState(null);

  const initialRender = useRef(true);

  // Fetch account data if not passed through state
  useEffect(() => {
    const fetchAccount = async () => {
      if (!account && accountId) {
        try {
          const response = await accountService.getAccountById(accountId);
          setAccountData(response.data);
        } catch (error) {
          console.error('Error fetching account:', error);
        }
      }
    };
    fetchAccount();
  }, [accountId, account]);

  // Set default date range on component mount
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    setStartDate(firstDay);
    setEndDate(lastDay);
  }, []);

  useEffect(() => {
    // Skip the initial state setup calls
    if (initialRender.current) {
      if (startDate && endDate && accountData?._id) {
        initialRender.current = false;
        fetchLedgerData();
      }
      return;
    }
    
    // Only run for subsequent updates
    if (accountData?._id) {
      fetchLedgerData();
    }
  }, [accountData, dateRange, startDate, endDate]);

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      
      // For all_time, only send the dateRange parameter
      let params = {};
      if (dateRange === 'all_time') {
        params = { dateRange };
      } else {
        params = {
          dateRange,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString()
        };
      }
      
      let response = await accountService.getAccountLedger(accountData._id, params);
      
      if (response.success) {
        setLedgerData(response.data);
      }
    } catch (error) {
      console.error('Error fetching ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  const rows = useMemo(() => {
    if (!ledgerData) return [];
    return ledgerData.transactions.map((transaction, index) => ({
      id: transaction._id || `trans-${index}`,
      date: transaction.date,
      particulars: transaction.particulars,
      dr: transaction.type === 'debit' ? transaction.amount : null,
      cr: transaction.type === 'credit' ? transaction.amount : null,
      balance: transaction.runningBalance
    }));
  }, [ledgerData]);

  // Custom footer component
  const CustomFooter = () => (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        borderTop: '2px solid',
        borderColor: 'divider',
        bgcolor: 'action.hover'
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 600,
          mr: 2
        }}
      >
        Closing Balance:
      </Typography>
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 600,
          color: ledgerData?.closingBalance >= 0 ? 'success.main' : 'error.main',
          width: 150,
          textAlign: 'right'
        }}
      >
        ₹{ledgerData?.closingBalance 
          ? Math.abs(ledgerData.closingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })
          : '0.00'}
        <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
          {ledgerData?.closingBalance >= 0 ? 'Dr' : 'Cr'}
        </Typography>
      </Typography>
    </Box>
  );

  const handleDateRangeChange = (newValue) => {
    setDateRange(newValue);
    
    const now = new Date();
    
    if (newValue === 'custom') {
      setTempStartDate(startDate);
      setTempEndDate(endDate);
      setOpenDateDialog(true);
      return;
    }
    
    // Set date range based on selection
    switch (newValue) {
      case 'all_time':
        // No need to set specific dates, backend will handle this
        setStartDate(null);
        setEndDate(null);
        break;
        
      case 'yearly':
        // Current year
        setStartDate(new Date(now.getFullYear(), 0, 1));
        setEndDate(new Date(now.getFullYear(), 11, 31, 23, 59, 59));
        break;
        
      case 'quarterly':
        // Current quarter
        const currentQuarter = Math.floor(now.getMonth() / 3);
        setStartDate(new Date(now.getFullYear(), currentQuarter * 3, 1));
        setEndDate(new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59));
        break;
        
      case 'monthly':
        // Current month
        setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
        setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59));
        break;
        
      case 'weekly':
        // Current week (Sunday to Saturday)
        const day = now.getDay(); // 0 = Sunday, 6 = Saturday
        const diff = now.getDate() - day;
        setStartDate(new Date(now.setDate(diff))); // Start of week (Sunday)
        const endOfWeek = new Date(now);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        setEndDate(endOfWeek);
        break;
        
      default:
        // Default to monthly
        setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
        setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59));
    }
  };

  const handleDateDialogClose = () => {
    setOpenDateDialog(false);
    if (dateRange === 'custom') {
      setDateRange('monthly'); // Reset to monthly if dialog is cancelled
    }
  };

  const handleDateDialogSubmit = () => {
    if (tempStartDate && tempEndDate) {
      setStartDate(tempStartDate);
      setEndDate(tempEndDate);
      setDateRange('custom');
      setOpenDateDialog(false);
    }
  };

  const SummaryCard = ({ title, value, type }) => (
    <Card sx={{ 
      height: '100%',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
      transition: 'transform 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)'
      }
    }}>
      <CardContent>
        <Typography color="textSecondary" variant="body2" gutterBottom>
          {title}
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            color: type === 'opening' ? 'primary.main' : (value >= 0 ? 'success.main' : 'error.main'),
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}
        >
          ₹{Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
            {value >= 0 ? 'Dr' : 'Cr'}
          </Typography>
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <MainLayout>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 600,
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}>
              {accountData?.accountType === 'Sale' ? 'Sales Ledger' : `${accountData?.accountName} Ledger`}
            </Typography>
          </Box>

          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <SummaryCard 
                title="Opening Balance" 
                value={ledgerData?.openingBalance || 0}
                type="opening"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <SummaryCard 
                title="Current Balance" 
                value={ledgerData?.closingBalance || 0}
              />
            </Grid>
          </Grid>

          {/* Date Range Controls */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <Select
                  value={dateRange}
                  onChange={(e) => handleDateRangeChange(e.target.value)}
                >
                  {dateRanges.map((range) => (
                    <MenuItem key={range.value} value={range.value}>
                      {range.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Custom Date Range Dialog */}
          <Dialog 
            open={openDateDialog} 
            onClose={handleDateDialogClose}
            PaperProps={{
              sx: { minWidth: { xs: '90%', sm: 400 } }
            }}
          >
            <DialogTitle>Select Date Range</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <DatePicker
                  label="Start Date"
                  value={tempStartDate}
                  onChange={setTempStartDate}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth />
                  )}
                  maxDate={tempEndDate || new Date()}
                />
                <DatePicker
                  label="End Date"
                  value={tempEndDate}
                  onChange={setTempEndDate}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth />
                  )}
                  minDate={tempStartDate}
                  maxDate={new Date()}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDateDialogClose}>Cancel</Button>
              <Button 
                onClick={handleDateDialogSubmit}
                variant="contained"
                disabled={!tempStartDate || !tempEndDate}
              >
                Apply
              </Button>
            </DialogActions>
          </Dialog>

          {/* Ledger Table */}
          <Paper sx={{ 
            height: '75vh', 
            width: '100%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
            borderRadius: 2
          }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={100}
              rowsPerPageOptions={[100]}
              disableSelectionOnClick
              loading={loading}
              components={{
                Footer: CustomFooter
              }}
              sx={{
                '& .MuiDataGrid-root': {
                  border: 'none',
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'primary.light',
                  borderBottom: 'none'
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  fontWeight: 600
                }
              }}
            />
          </Paper>
        </Box>
      </LocalizationProvider>
    </MainLayout>
  );
};

export default AccountLedger; 