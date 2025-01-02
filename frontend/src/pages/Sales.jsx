import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import DataTable from '../components/DataTable';
import { useSnackbar } from 'notistack';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  const columns = [
    { field: 'date', headerName: 'Date', flex: 1 },
    { field: 'customer', headerName: 'Customer', flex: 1 },
    { field: 'totalAmount', headerName: 'Total Amount', flex: 1 },
    { field: 'status', headerName: 'Status', flex: 1 },
  ];

  useEffect(() => {
    // Implement fetch sales logic
    setLoading(false);
  }, []);

  const handleCreateSale = async (saleData) => {
    try {
      await createSale(saleData);
      enqueueSnackbar('Sale recorded successfully!', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to record sale', { variant: 'error' });
    }
  };

  const handleVoidSale = async (saleId) => {
    try {
      await voidSale(saleId);
      enqueueSnackbar('Sale voided successfully!', { variant: 'info' });
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to void sale', { variant: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Sales Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => console.log('Create sale')}
        >
          Create Sale
        </Button>
      </Box>

      <DataTable
        rows={sales}
        columns={columns}
        loading={loading}
      />
    </Box>
  );
};

export default Sales; 