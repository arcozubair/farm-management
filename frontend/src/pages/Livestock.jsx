import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { livestockService } from '../services/livestockService';
import DataTable from '../components/DataTable';
import LivestockForm from '../components/Forms/LivestockForm';
import { useSnackbar } from 'notistack';

const Livestock = () => {
  const [livestock, setLivestock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [selectedLivestock, setSelectedLivestock] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const columns = [
    { field: 'type', headerName: 'Type', flex: 1 },
    { field: 'gender', headerName: 'Gender', flex: 1 },
    { field: 'age', headerName: 'Age', flex: 1 },
    { field: 'weight', headerName: 'Weight', flex: 1 },
    { field: 'status', headerName: 'Status', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params) => (
        <Button
          size="small"
          onClick={() => handleEdit(params.row)}
        >
          Edit
        </Button>
      ),
    },
  ];

  const fetchLivestock = async () => {
    try {
      setLoading(true);
      const response = await livestockService.getAll();
      console.log('Fetched livestock:', response.data); // Debug log
      setLivestock(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error fetching livestock:', error);
      setLivestock([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivestock();
  }, []);

  const handleEdit = (livestock) => {
    setSelectedLivestock(livestock);
    setOpenForm(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (selectedLivestock) {
        await livestockService.update(selectedLivestock._id, values);
      } else {
        await livestockService.create(values);
      }
      setOpenForm(false);
      setSelectedLivestock(null);
      fetchLivestock(); // Refresh the list
      enqueueSnackbar('Livestock added successfully!', { variant: 'success' });
    } catch (error) {
      console.error('Error saving livestock:', error);
      enqueueSnackbar(error.message || 'Failed to add livestock', { variant: 'error' });
    }
  };

  const handleAddLivestock = async (data) => {
    try {
      await livestockService.create(data);
      enqueueSnackbar('Livestock added successfully!', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to add livestock', { variant: 'error' });
    }
  };

  const handleUpdateLivestock = async (id, data) => {
    try {
      await livestockService.update(id, data);
      enqueueSnackbar('Livestock updated successfully!', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to update livestock', { variant: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Livestock Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenForm(true)}
        >
          Add Livestock
        </Button>
      </Box>

      <DataTable
        rows={livestock}
        columns={columns}
        loading={loading}
      />

      <Dialog
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setSelectedLivestock(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <LivestockForm
          onClose={() => {
            setOpenForm(false);
            setSelectedLivestock(null);
          }}
          onSubmit={handleSubmit}
          initialValues={selectedLivestock}
        />
      </Dialog>
    </Box>
  );
};

export default Livestock; 