import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  Tooltip,
  Grid,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DataTable from '../components/DataTable';
import { useSnackbar } from 'notistack';
import  * as saleService from '../services/saleServices';
import AddSaleDialog from '../components/AddSaleDialog';
import useResponsiveness from '../hooks/useResponsive';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { enqueueSnackbar } = useSnackbar();
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const { isMobile, isTablet } = useResponsiveness();

const handleCloseSaleDialog = () => {
  setSaleDialogOpen(false);
  fetchSales();
}

  const columns = [
    { 
      field: 'date', 
      headerName: 'Date', 
      flex: 1,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    },
    { field: 'saleNumber', headerName: 'Sale Number', flex: 1 },
    { field: 'customerName', headerName: 'Customer', flex: 1 },
   
    { 
      field: 'totalAmount', 
      headerName: 'Amount', 
      flex: 1,
      valueFormatter: (params) => {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR'
        }).format(params.value);
      }
    },
  ];

  useEffect(() => {
    fetchSales();
  }, [selectedDate]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await saleService.getSales(selectedDate);
      if (response.success) {
        const formattedSales = response.data.map(sale => ({
          ...sale,
          customerName: sale.customer?.name || 'N/A',
          debitAccountName: sale.debitAccount?.accountName || 'N/A',
          creditAccountName: sale.creditAccount?.accountName || 'N/A'
        }));
        setSales(formattedSales);
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to fetch sales', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

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
      <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
        <Grid item xs={12} sm={4}>
          <Typography variant="h4">Sales Management</Typography>
        </Grid>
        <Grid item xs={12} >
          <Grid container spacing={2} >
            <Grid item  md={8}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={(newValue) => setSelectedDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item md={4}>
              <Tooltip title={isMobile ? "Add Sale" : ""}>
                <Button 
                  variant="contained"
                  color="success"
                  onClick={() => setSaleDialogOpen(true)}
                  fullWidth
                >
                  {isMobile ? (
                    <AddIcon />
                  ) : (
                    <>Add Sale</>
                  )}
                </Button>
              </Tooltip>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <DataTable
        rows={sales}
        columns={columns}
        loading={loading}
      />
        <AddSaleDialog
        open={saleDialogOpen}
        onClose={() => handleCloseSaleDialog()}
      />
    </Box>
    
  );
};

export default Sales; 