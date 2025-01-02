import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { customerService } from '../services/customerService';
import DataTable from '../components/DataTable';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'contactNumber', headerName: 'Contact', flex: 1 },
    { field: 'currentBalance', headerName: 'Balance', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params) => (
        <Button
          size="small"
          onClick={() => handleViewLedger(params.row)}
        >
          View Ledger
        </Button>
      ),
    },
  ];

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getAll();
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleViewLedger = (customer) => {
    // Implement view ledger logic
    console.log('View ledger for:', customer);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Customer Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => console.log('Add customer')}
        >
          Add Customer
        </Button>
      </Box>

      <DataTable
        rows={customers}
        columns={columns}
        loading={loading}
      />
    </Box>
  );
};

export default Customers; 