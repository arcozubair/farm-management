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

const PartyPreview = ({ party, type }) => {
  if (!party) return null;
  const name = type === 'sale' ? party.customerName : party.supplierName;
  return (
    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Typography variant="subtitle1" gutterBottom>
        Selected {type === 'sale' ? 'Customer' : 'Supplier'} Details
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">
            Name: {name || 'N/A'}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body2" color="text.secondary">
            Contact: {party.contactNo || 'N/A'}
          </Typography>
        </Grid>
        {party.email && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Email: {party.email}
            </Typography>
          </Grid>
        )}
        {party.address && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Address: {party.address}
            </Typography>
          </Grid>
        )}
        {party.initialBalance !== undefined && (
          <Grid item xs={12}>
            <Typography
              variant="body2"
              sx={{
                color: party.balanceType === 'Credit' ? 'success.main' : 'error.main',
              }}
            >
              Balance: {formatBalance(party.initialBalance, party.balanceType)}
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

const AddTransactionDialog = ({ open, onClose, type }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { isMobile } = useResponsiveness();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
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
      setSelectedParty(null);
      setSearchInputValue('');
      setAccounts([]);
      setError(null);
    }
  }, [open]);

  const handleSearch = async (searchText) => {
    const safeSearchText = searchText || '';
    if (safeSearchText.length < 2) {
      setAccounts([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await accountService.getAccounts({
        accountType: type === 'sale' ? 'Customer' : 'Supplier',
        search: safeSearchText,
      });
      setAccounts(response.data || []);
    } catch (error) {
      console.error(`Error searching ${type === 'sale' ? 'customers' : 'suppliers'}:`, error);
      setError(`Failed to search ${type === 'sale' ? 'customers' : 'suppliers'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = React.useCallback(
    (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
    []
  )(handleSearch, 300);

  const handlePartySelect = (event, value) => {
    setSelectedParty(value);
    if (value) setInvoiceDialogOpen(true);
  };

  const handleInvoiceClose = () => {
    setInvoiceDialogOpen(false);
    setSelectedParty(null);
    setSearchInputValue('');
    onClose();
  };

  const handleWalkInParty = async () => {
    try {
      const response = await accountService.getAccounts({
        accountType: type === 'sale' ? 'Customer' : 'Supplier',
        search: type === 'sale' ? 'Walk-in Customer' : 'Walk-in Supplier',
      });
      const walkInParty = response.data?.[0];
      if (walkInParty) handlePartySelect(null, walkInParty);
    } catch (error) {
      setError(`Failed to load walk-in ${type === 'sale' ? 'customer' : 'supplier'}`);
    }
  };

  const handleAddNewParty = () => {
    setCreateAccountDialogOpen(true);
  };

  const handleCreateAccountClose = () => {
    setCreateAccountDialogOpen(false);
  };

  const handleCreateAccountSave = (newParty) => {
    setCreateAccountDialogOpen(false);
    const partyName = type === 'sale' ? newParty?.customerName : newParty?.supplierName || '';
    setSearchInputValue(partyName);
    debouncedSearch(partyName);
    setSelectedParty(newParty || null);
    setInvoiceDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add {type === 'sale' ? 'Sale' : 'Purchase'}</Typography>
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
            <Button variant="outlined" size="small" onClick={handleWalkInParty}>
              Walk-in {type === 'sale' ? 'Customer' : 'Supplier'}
            </Button>
            <Button variant="outlined" size="small" onClick={handleAddNewParty}>
              Add New {type === 'sale' ? 'Customer' : 'Supplier'}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ minWidth: 300 }}>
            <Autocomplete
              options={accounts}
              getOptionLabel={(option) => {
                const name = type === 'sale' ? option.customerName : option.supplierName;
                return `${name || 'N/A'} (${option.contactNo || 'No contact'})`;
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={`Search ${type === 'sale' ? 'Customer' : 'Supplier'}`}
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
              onChange={handlePartySelect}
              value={selectedParty}
              inputValue={searchInputValue}
              onInputChange={(event, newInputValue) => {
                const safeValue = newInputValue || '';
                setSearchInputValue(safeValue);
                debouncedSearch(safeValue);
              }}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body1">
                      {type === 'sale' ? option.customerName : option.supplierName || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      {option.contactNo && `Contact: ${option.contactNo}`}
                      {option.email && ` • Email: ${option.email}`}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                      {option.address && `Address: ${option.address}`}
                    </Typography>
                  </Box>
                </li>
              )}
            />
          </Box>

          <PartyPreview party={selectedParty} type={type} />
        </DialogContent>
      </Dialog>

      {selectedParty && (
        <CreateInvoiceDialog
          open={invoiceDialogOpen}
          onClose={handleInvoiceClose}
          customer={selectedParty}
          type={type}
        />
      )}

      <Dialog open={createAccountDialogOpen} onClose={handleCreateAccountClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add New {type === 'sale' ? 'Customer' : 'Supplier'}</Typography>
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
            defaultAccountType={type === 'sale' ? 'Customer' : 'Supplier'}
            onSave={handleCreateAccountSave}
            onCancel={handleCreateAccountClose}
            enqueueSnackbar={enqueueSnackbar}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddTransactionDialog; 