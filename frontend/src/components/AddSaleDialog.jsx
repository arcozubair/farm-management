import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Autocomplete,
  TextField,
  Box,
  CircularProgress,
  Typography,
  Grid,
  Button,
  Alert,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import accountService from '../services/accountService';
import CreateInvoiceDialog from './CreateInvoiceDialog';
import useResponsiveness from '../hooks/useResponsive';

// Move formatBalance to be accessible by both components
const formatBalance = (balance, balanceType) => {
  const amount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(Math.abs(balance || 0));

  return `${amount} ${balanceType || 'DR'}`;
};

const CustomerPreview = ({ customer }) => {
  if (!customer) return null;
  
  return (
    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Typography variant="subtitle1" gutterBottom>
        Selected Customer Details
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">
            Name: {customer.customerName}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">
            Contact: {customer.contactNo || 'N/A'}
          </Typography>
        </Grid>
        {customer.email && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Email: {customer.email}
            </Typography>
          </Grid>
        )}
        {customer.address && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Address: {customer.address}
            </Typography>
          </Grid>
        )}
        {customer.openingBalance !== undefined && (
          <Grid item xs={12}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: customer.openingBalanceType === 'Credit' ? 'success.main' : 'error.main'
              }}
            >
              Balance: {formatBalance(customer.openingBalance, customer.openingBalanceType)}
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

const AddSaleDialog = ({ open, onClose }) => {
  const { isMobile } = useResponsiveness();
  const [customerAccounts, setCustomerAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');

  const searchInputRef = React.useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (searchInputRef.current) {
          const input = searchInputRef.current.querySelector('input');
          if (input) {
            input.focus();
          }
        }
      }, 100);
    } else {
      // Reset states when dialog closes
      setSelectedCustomer(null);
      setSearchInputValue('');
      setCustomerAccounts([]);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      window.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [open, onClose]);

  const handleSearch = async (searchText) => {
    if (searchText.length < 2) {
      setCustomerAccounts([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await accountService.getAccounts({
        accountType: 'Customer',
        search: searchText
      });
      setCustomerAccounts(response.data || []);
    } catch (error) {
      console.error('Error searching customer accounts:', error);
      setError('Failed to search customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const debouncedSearch = debounce(handleSearch, 300);

  const handleCustomerSelect = (event, value) => {
    setSelectedCustomer(value);
    if (value) {
      setInvoiceDialogOpen(true);
    }
  };

  const handleInvoiceClose = () => {
    setInvoiceDialogOpen(false);
    setSelectedCustomer(null);
    setSearchInputValue('');
    
    onClose();
  };

  const handleWalkInCustomer = async () => {
    try {
      const response = await accountService.getAccounts({
        accountType: 'Customer',
        search: 'Walk-in Customer'
      });
      const walkInCustomer = response.data?.[0];
      if (walkInCustomer) {
        handleCustomerSelect(null, walkInCustomer);
      }
    } catch (error) {
      setError('Failed to load walk-in customer');
    }
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add Sale</Typography>
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">Quick Actions</Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleWalkInCustomer}
            >
              Walk-in Customer
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ minWidth: 300 }}>
            <Autocomplete
              options={customerAccounts}
              getOptionLabel={(option) => `${option.customerName} (${option.contactNo || 'No contact'})`}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Customer"
                  ref={searchInputRef}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : (
                          <SearchIcon color="action" />
                        )}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              onChange={handleCustomerSelect}
              value={selectedCustomer}
              inputValue={searchInputValue}
              onInputChange={(event, newInputValue) => {
                setSearchInputValue(newInputValue);
                debouncedSearch(newInputValue);
              }}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body1">{option.customerName}</Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      {option.contactNo && `Contact: ${option.contactNo}`}
                      {option.email && ` • Email: ${option.email}`}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      {option.address && `Address: ${option.address}`}
                    </Typography>
                    {option.openingBalance !== undefined && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          color: option.openingBalanceType === 'Credit' ? 'success.main' : 'error.main'
                        }}
                      >
                        Balance: {formatBalance(option.openingBalance, option.openingBalanceType)}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
              noOptionsText={
                searchInputValue.length < 2 
                  ? "Type at least 2 characters to search" 
                  : loading 
                    ? "Searching..." 
                    : "No customers found"
              }
              loading={loading}
              loadingText={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">Searching customers...</Typography>
                </Box>
              }
            />
          </Box>

          <CustomerPreview customer={selectedCustomer} />
        </DialogContent>
      </Dialog>

      {selectedCustomer && (
        <CreateInvoiceDialog
          open={invoiceDialogOpen}
          onClose={handleInvoiceClose}
          customer={selectedCustomer}
        />
      )}
    </>
  );
};

export default AddSaleDialog; 