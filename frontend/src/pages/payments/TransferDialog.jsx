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
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
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
      const response = await accountService.createTransfer({
        fromAccountId: transferForm.fromAccount,
        toAccountId: transferForm.toAccount,
        amount: Number(transferForm.amount),
        notes: transferForm.notes
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
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={transferForm.amount}
              onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
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
          disabled={loading || !transferForm.fromAccount || !transferForm.toAccount || !transferForm.amount}
        >
          {loading ? <CircularProgress size={24} /> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransferDialog;