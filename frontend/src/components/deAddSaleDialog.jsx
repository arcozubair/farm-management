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
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from 'notistack';
import accountService from '../services/accountService';
import CreateInvoiceDialog from './deCreateInvoiceDialog';
import useResponsiveness from '../hooks/useResponsive';
import CreateAccountForm from '../pages/accounts/CreateAccountForm';

const formatBalance = (balance, balanceType) => {
  const amount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
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
            Name: {customer.customerName || 'N/A'}
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
        {customer.initialBalance !== undefined && (
          <Grid item xs={12}>
            <Typography
              variant="body2"
              sx={{
                color: customer.balanceType === 'Credit' ? 'success.main' : 'error.main',
              }}
            >
              Balance: {formatBalance(customer.initialBalance, customer.balanceType)}
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

const AddSaleDialog = ({ open, onClose }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { isMobile } = useResponsiveness();
  const [customerAccounts, setCustomerAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [createAccountDialogOpen, setCreateAccountDialogOpen] = useState(false);

  const searchInputRef = React.useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (searchInputRef.current) {
          const input = searchInputRef.current.querySelector('input');
          if (input) input.focus();
        }
      }, 100);
    } else {
      setSelectedCustomer(null);
      setSearchInputValue('');
      setCustomerAccounts([]);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [open, onClose]);

  const handleSearch = async (searchText) => {
    const safeSearchText = searchText || '';
    if (safeSearchText.length < 2) {
      setCustomerAccounts([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await accountService.getAccounts({
        accountType: 'Customer',
        search: safeSearchText,
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
    if (value) setInvoiceDialogOpen(true);
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
        search: 'Walk-in Customer',
      });
      const walkInCustomer = response.data?.[0];
      if (walkInCustomer) handleCustomerSelect(null, walkInCustomer);
    } catch (error) {
      setError('Failed to load walk-in customer');
    }
  };

  const handleAddNewCustomer = () => {
    setCreateAccountDialogOpen(true);
  };

  const handleCreateAccountClose = () => {
    setCreateAccountDialogOpen(false);
  };

  const handleCreateAccountSave = (newCustomer) => {
    console.log('New Customer:', newCustomer);
    setCreateAccountDialogOpen(false);
    const customerName = newCustomer?.customerName || '';
    setSearchInputValue(customerName);
    debouncedSearch(customerName);
    setSelectedCustomer(newCustomer || null);
    setInvoiceDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add Sale</Typography>
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">Quick Actions</Typography>
            <Button variant="outlined" size="small" onClick={handleWalkInCustomer}>
              Walk-in Customer
            </Button>
            <Button variant="outlined" size="small" onClick={handleAddNewCustomer}>
              Add New Customer
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
              getOptionLabel={(option) => `${option.customerName || 'N/A'} (${option.contactNo || 'No contact'})`}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Customer"
                  ref={searchInputRef}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loading ? <CircularProgress color="inherit" size={20} /> : <SearchIcon color="action" />}
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
                const safeValue = newInputValue || '';
                setSearchInputValue(safeValue);
                debouncedSearch(safeValue);
              }}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body1">{option.customerName || 'N/A'}</Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      {option.contactNo && `Contact: ${option.contactNo}`}
                      {option.email && ` • Email: ${option.email}`}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      {option.address && `Address: ${option.address}`}
                    </Typography>
                    {option.initialBalance !== undefined && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          color: option.balanceType === 'Credit' ? 'success.main' : 'error.main',
                        }}
                      >
                        Balance: {formatBalance(option.initialBalance, option.balanceType)}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
              noOptionsText={
                searchInputValue.length < 2
                  ? 'Type at least 2 characters to search'
                  : loading
                  ? 'Searching...'
                  : 'No customers found'
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

      <Dialog open={createAccountDialogOpen} onClose={handleCreateAccountClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add New Customer</Typography>
            <IconButton
              aria-label="close"
              onClick={handleCreateAccountClose}
              sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <CreateAccountForm
            defaultAccountType="Customer"
            onSave={handleCreateAccountSave}
            onCancel={handleCreateAccountClose}
            enqueueSnackbar={enqueueSnackbar}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddSaleDialog;