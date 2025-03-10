import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  IconButton,
  Typography
} from '@mui/material';
import { Close as CloseIcon, SwapVert as SwapVertIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import accountService from '../../services/accountService';
import useResponsiveness from '../../hooks/useResponsive';

const TransferDialog = ({ open, onClose }) => {
  const { isMobile } = useResponsiveness();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [transferForm, setTransferForm] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    notes: ''
  });
  const [amountError, setAmountError] = useState(false); // Add state for error handling

  useEffect(() => {
    if (open) {
      fetchAccounts();
    }
  }, [open]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const [cashAccounts, bankAccounts] = await Promise.all([
        accountService.getAccounts({ accountType: 'Cash' }),
        accountService.getAccounts({ accountType: 'Bank' })
      ]);
      
      setAccounts([
        ...(cashAccounts.data || []),
        ...(bankAccounts.data || [])
      ]);
    } catch (error) {
      enqueueSnackbar('Failed to fetch accounts', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      let transferData = {
        fromAccountId: transferForm.fromAccount,
        toAccountId: transferForm.toAccount,
        amount: Number(transferForm.amount),
        notes: transferForm.notes
      }
      const response = await accountService.createTransfer({
        transferData
      });

      if (response.success) {
        enqueueSnackbar('Transfer completed successfully', { variant: 'success' });
        handleClose();
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to process transfer', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTransferForm({
      fromAccount: '',
      toAccount: '',
      amount: '',
      notes: ''
    });
    setAmountError(false); // Reset error state on close
    onClose();
  };

  const handleSwap = () => {
    setTransferForm(prev => ({
      ...prev,
      fromAccount: prev.toAccount,
      toAccount: prev.fromAccount
    }));
  };

  // Find selected accounts to display their balances
  const fromAccount = accounts.find(acc => acc._id === transferForm.fromAccount);
  const toAccount = accounts.find(acc => acc._id === transferForm.toAccount);

  // Function to format balance with Cr/Dr
  const formatBalance = (balance) => {
    if (balance === undefined || balance === null) return '$0.00';
    const absBalance = Math.abs(balance).toFixed(2);
    const isCredit = balance >= 0;
    return `${absBalance} ${isCredit ? 'Cr' : 'Dr'}`;
  };

  // Validate and handle amount change
  const handleAmountChange = (e) => {
    const value = e.target.value;
    const numValue = Number(value);
    
    // Allow empty input or valid number > 0
    if (value === '' || (numValue > 0 && !isNaN(numValue))) {
      setTransferForm({ ...transferForm, amount: value });
      setAmountError(false);
    } else {
      setAmountError(true); // Set error if value <= 0 or invalid
    }
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
        New Transfer
        <IconButton
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>From Account</InputLabel>
              <Select
                value={transferForm.fromAccount}
                onChange={(e) => setTransferForm({ ...transferForm, fromAccount: e.target.value })}
              >
                {accounts.map((account) => (
                  <MenuItem 
                    key={account._id} 
                    value={account._id}
                    disabled={account._id === transferForm.toAccount}
                  >
                    {account.accountName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {fromAccount && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Balance: {formatBalance(fromAccount.balance)}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', my: -1 }}>
            <IconButton 
              onClick={handleSwap}
              sx={{ 
                bgcolor: 'background.paper',
                boxShadow: 1,
                '&:hover': { bgcolor: 'background.paper' }
              }}
            >
              <SwapVertIcon />
            </IconButton>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>To Account</InputLabel>
              <Select
                value={transferForm.toAccount}
                onChange={(e) => setTransferForm({ ...transferForm, toAccount: e.target.value })}
              >
                {accounts.map((account) => (
                  <MenuItem 
                    key={account._id} 
                    value={account._id}
                    disabled={account._id === transferForm.fromAccount}
                  >
                    {account.accountName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {toAccount && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Balance: {formatBalance(toAccount.balance)}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={transferForm.amount}
              onChange={handleAmountChange} // Use custom handler
              error={amountError} // Show error state
              helperText={amountError ? 'Amount must be greater than 0' : ''} // Error message
              inputProps={{ min: 0 }} // HTML5 min attribute (optional, not strict enforcement)
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={transferForm.notes}
              onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            loading || 
            !transferForm.fromAccount || 
            !transferForm.toAccount || 
            !transferForm.amount || 
            amountError 
          }
        >
          {loading ? <CircularProgress size={24} /> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransferDialog;