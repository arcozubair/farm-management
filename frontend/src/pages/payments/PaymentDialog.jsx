import React, { useState, useEffect, useMemo } from 'react';
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
  Box,
  Typography,
  MenuItem
} from '@mui/material';
import { Close as CloseIcon, Search as SearchIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import accountService from '../../services/accountService';
import useResponsiveness from '../../hooks/useResponsive';

const PaymentDialog = ({ open, onClose, paymentType }) => {
  const { isMobile } = useResponsiveness();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    notes: '',
    paymentAccountId: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [touched, setTouched] = useState({
    paymentAccountId: false,
    amount: false
  });

  const debouncedSearch = useMemo(() => {
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

    return debounce((query) => {
      if (query.length >= 2) {
        fetchAccounts(query);
      } else {
        setAccounts([]);
      }
    }, 300);
  }, [paymentType]);

  useEffect(() => {
    if (open) {
      debouncedSearch(searchQuery);
    }
  }, [searchQuery, paymentType]);

  console.log("heyeyyey",paymentType);

  useEffect(() => {
    const fetchPaymentAccounts = async () => {
      try {
        // Fetch both Cash and Bank accounts
        const cashResponse = await accountService.getAccounts({
          accountType: 'Cash'
        });
        
        const bankResponse = await accountService.getAccounts({
          accountType: 'Bank'
        });
        
        // Combine both results
        const combinedAccounts = [
          ...(cashResponse.data || []),
          ...(bankResponse.data || [])
        ];

        if (combinedAccounts.length === 0) {
          enqueueSnackbar('No cash or bank accounts found', { variant: 'warning' });
        }
        
        setPaymentAccounts(combinedAccounts);
      } catch (error) {
        console.error('Error fetching payment accounts:', error);
        enqueueSnackbar('Failed to fetch payment accounts', { variant: 'error' });
      }
    };

    if (open) {
      fetchPaymentAccounts();
    }
  }, [open]);

  const fetchAccounts = async (query) => {
    try {
      setIsSearching(true);
      const accountType = paymentType === 'receive' ? 'Customer' : 'Supplier';
      const response = await accountService.getAccounts({
        accountType,
        search: query
      });
      
      if (response.success && Array.isArray(response.data)) {
        setAccounts(response.data);
      } else {
        setAccounts([]);
      }
    } catch (error) {
      enqueueSnackbar('Failed to fetch accounts', { variant: 'error' });
      setAccounts([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAccount || !paymentForm.paymentAccountId || !paymentForm.amount) {
      enqueueSnackbar('Please fill in all required fields', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      const response = await accountService.createPayment({
        accountId: selectedAccount._id,
        amount: Number(paymentForm.amount),
        paymentType,
        paymentAccountId: paymentForm.paymentAccountId,
        notes: paymentForm.notes
      });

      if (response.success) {
        enqueueSnackbar('Payment processed successfully', { variant: 'success' });
        handleClose();
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to process payment', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedAccount(null);
    setPaymentForm({ amount: '', notes: '', paymentAccountId: '' });
    setSearchQuery('');
    setTouched({ paymentAccountId: false, amount: false });
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
      <DialogTitle>
        {paymentType === 'receive' ? 'Receive Payment' : 'Make Payment'}
        <IconButton
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Customer/Supplier Search */}
          <Grid item xs={12}>
            <Autocomplete
              fullWidth
              options={accounts}
              loading={isSearching}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return option?.accountName || option?.customerName || option?.supplierName || '';
              }}
              isOptionEqualToValue={(option, value) => {
                if (!option || !value) return false;
                return option._id === value._id;
              }}
              value={selectedAccount}
              onChange={(_, newValue) => setSelectedAccount(newValue)}
              onInputChange={(_, value) => setSearchQuery(value)}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body1">
                      {option?.accountName || option?.customerName || option?.supplierName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      {option?.contactNo && `Contact: ${option.contactNo}`}
                    </Typography>
                    {option?.address && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                        Address: {option.address}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={`Search ${paymentType === 'receive' ? 'Customer' : 'Supplier'}`}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isSearching ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : (
                          <SearchIcon />
                        )}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>

          {selectedAccount && (
            <>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Balance"
                  disabled
                  value={selectedAccount?.balance ? `₹${selectedAccount.balance.toLocaleString()}` : '-'}
                  InputProps={{
                    startAdornment: (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mr: 1 }}
                      >
                        Current Balance:
                      </Typography>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Payment Account"
                  value={paymentForm.paymentAccountId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentAccountId: e.target.value })}
                  onBlur={() => setTouched(prev => ({ ...prev, paymentAccountId: true }))}
                  error={touched.paymentAccountId && !paymentForm.paymentAccountId}
                  helperText={touched.paymentAccountId && !paymentForm.paymentAccountId ? 'Please select payment account' : ''}
                >
                  {paymentAccounts.map((account) => (
                    <MenuItem key={account._id} value={account._id}>
                      {account.accountName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  onBlur={() => setTouched(prev => ({ ...prev, amount: true }))}
                  error={touched.amount && !paymentForm.amount}
                  helperText={touched.amount && !paymentForm.amount ? 'Please enter amount' : ''}
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 }
                  }}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
            />
          </Grid>

          {/* Payment Breakdown */}
          {selectedAccount && paymentForm.amount > 0 && (
            <Grid item xs={12}>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'background.paper', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'primary.main'
              }}>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="primary">
                      Payment Breakdown
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Previous Balance: ₹{selectedAccount.balance.toLocaleString()}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Payment Amount: ₹{Number(paymentForm.amount).toLocaleString()}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ 
                      color: paymentType === 'receive' 
                        ? selectedAccount.balance - Number(paymentForm.amount) > 0 
                          ? 'warning.main' 
                          : 'success.main'
                        : selectedAccount.balance + Number(paymentForm.amount) > 0 
                          ? 'warning.main' 
                          : 'success.main',
                      fontWeight: 'bold'
                    }}>
                      {paymentType === 'receive' 
                        ? selectedAccount.balance - Number(paymentForm.amount) > 0
                          ? `Remaining Balance: ₹${(selectedAccount.balance - Number(paymentForm.amount)).toLocaleString()}`
                          : `Advance Amount: ₹${Math.abs(selectedAccount.balance - Number(paymentForm.amount)).toLocaleString()}`
                        : `New Balance: ₹${(selectedAccount.balance + Number(paymentForm.amount)).toLocaleString()}`
                      }
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !selectedAccount || !paymentForm.paymentAccountId || !paymentForm.amount}
        >
          {loading ? <CircularProgress size={24} /> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog;