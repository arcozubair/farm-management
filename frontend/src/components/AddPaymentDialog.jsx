import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Autocomplete,
  CircularProgress,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from '@mui/material';
import { Close as CloseIcon, Search as SearchIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import customerService from '../services/customerService';
import accountService from '../services/accountService';
import useResponsiveness from '../hooks/useResponsive';

const AddPaymentDialog = ({ open, onClose, onSuccess }) => {
  const { isMobile } = useResponsiveness();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [paymentForm, setPaymentForm] = useState({
    customerId: '',
    amount: '',
    paymentAccount: '',
    notes: ''
  });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [paymentNumber, setPaymentNumber] = useState('');

  useEffect(() => {
    fetchPaymentAccounts();
    fetchNextPaymentNumber();
  }, []);

  const fetchPaymentAccounts = async () => {
    try {
      const response = await accountService.getPaymentAccounts();
      if (response.success) {
        setPaymentAccounts(response.data);
      }
    } catch (error) {
      console.error('Error fetching payment accounts:', error);
      enqueueSnackbar('Failed to fetch payment accounts', { variant: 'error' });
    }
  };

  const fetchNextPaymentNumber = async () => {
    try {
      const response = await accountService.getNextPaymentNumber();
      if (response.success) {
        setPaymentNumber(response.data.paymentNumber);
      }
    } catch (error) {
      console.error('Error fetching payment number:', error);
    }
  };

  const searchCustomers = async (searchText) => {
    try {
      setIsSearching(true);
      const response = await customerService.searchCustomers(searchText);
      if (response.success) {
        setFilteredCustomers(response.data);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = debounce(searchCustomers, 300);

  const handleCustomerChange = (customer) => {
    setSelectedCustomer(customer);
    setPaymentForm(prev => ({ ...prev, customerId: customer?._id }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const response = await accountService.createPayment({
        ...paymentForm,
        paymentNumber
      });

      if (response.success) {
        enqueueSnackbar('Payment added successfully', { variant: 'success' });
        onSuccess();
        handleClose();
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to add payment', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPaymentForm({
      customerId: '',
      amount: '',
      paymentAccount: '',
      notes: ''
    });
    setSelectedCustomer(null);
    setSearchInputValue('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ 
        pb: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        Add Payment
        {isMobile && (
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Payment Number"
              value={paymentNumber}
              disabled
              size={isMobile ? "small" : "medium"}
            />
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              fullWidth
              options={filteredCustomers}
              getOptionLabel={(option) => option.name || ''}
              loading={isSearching}
              inputValue={searchInputValue}
              onInputChange={(event, newInputValue) => {
                setSearchInputValue(newInputValue);
                if (newInputValue.length >= 2) {
                  debouncedSearch(newInputValue);
                }
              }}
              onChange={(event, newValue) => handleCustomerChange(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Customer"
                  size={isMobile ? "small" : "medium"}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isSearching ? (
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
            />
          </Grid>

          {selectedCustomer && (
            <>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Balance"
                  value={selectedCustomer.currentBalance || 0}
                  disabled
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <FormControl fullWidth size={isMobile ? "small" : "medium"}>
              <InputLabel>Payment Account</InputLabel>
              <Select
                value={paymentForm.paymentAccount}
                onChange={(e) => setPaymentForm({
                  ...paymentForm,
                  paymentAccount: e.target.value
                })}
              >
                {paymentAccounts.map((account) => (
                  <MenuItem key={account._id} value={account._id}>
                    {account.accountName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({
                ...paymentForm,
                amount: e.target.value
              })}
              size={isMobile ? "small" : "medium"}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={2}
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({
                ...paymentForm,
                notes: e.target.value
              })}
              size={isMobile ? "small" : "medium"}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        {!isMobile && <Button onClick={handleClose}>Cancel</Button>}
        <Button
          onClick={handleSubmit}
          variant="contained"
          fullWidth={isMobile}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
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

export default AddPaymentDialog; 