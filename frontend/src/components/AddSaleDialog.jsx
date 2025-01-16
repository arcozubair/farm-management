import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Autocomplete,
  TextField,
  Box,
  CircularProgress,
  Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import customerService from '../services/customerService';
import CreateInvoiceDialog from './CreateInvoiceDialog';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';

const AddSaleDialog = ({ open, onClose }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
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
    }
  }, [open]);

  const handleSearch = async (searchText) => {
    if (searchText.length < 2) {
      setCustomers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await customerService.searchCustomers(searchText);
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce function
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

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        TransitionProps={{
          onEntered: () => {
            if (searchInputRef.current) {
              const input = searchInputRef.current.querySelector('input');
              if (input) {
                input.focus();
              }
            }
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="div">
              Add Sale
            </Typography>
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
          <Box sx={{ minWidth: 300, mt: 2 }}>
            <Autocomplete
              options={customers}
              getOptionLabel={(option) => `${option.name} (${option.contactNumber})`}
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
                    <Typography variant="body1">{option.name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      Contact: {option.contactNumber}
                      {option.currentBalance ? ` • Balance: ₹${option.currentBalance.toFixed(2)}` : ''}
                    </Typography>
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
              loadingText="Searching..."
            />
          </Box>
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