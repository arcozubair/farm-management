import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  Tooltip,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, GroupAddOutlined, Print as PrintIcon } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DataTable from '../../components/DataTable';
import { useSnackbar } from 'notistack';
import * as saleService from '../../services/saleServices';
import AddTransactionDialog from './AddTransactionDialog';
import useResponsiveness from '../../hooks/useResponsive';
import PrintInvoice from './PrintInvoice';
import accountService from '../../services/accountService';
import CreateSaleDialog from './CreateSaleDialog';
import EditSaleDialog from './EditSaleDialog';
import GroupSalesDialog from './GroupSalesDialog';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { enqueueSnackbar } = useSnackbar();
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const { isMobile, isTablet } = useResponsiveness();
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [groupSaleDialogOpen, setGroupSaleDialogOpen] = useState(false);

  const handleCloseSaleDialog = () => {
    setSaleDialogOpen(false);
    setTransactionDialogOpen(false);
    fetchSales();
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    fetchSales();
  };

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
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <IconButton
            color="primary"
            onClick={() => handleEditSale(params.row.id)}
            aria-label="edit"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleOpenDeleteDialog(params.row.id)}
            aria-label="delete"
          >
            <DeleteIcon />
          </IconButton>
          <IconButton
            color="default"
            onClick={() => handlePrintSale(params.row.id)}
            aria-label="print"
          >
            <PrintIcon />
          </IconButton>
        </>
      ),
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
          id: sale._id,
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
      await saleService.createSale(saleData);
      enqueueSnackbar('Sale recorded successfully!', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to record sale', { variant: 'error' });
    }
  };

  const handleVoidSale = async (saleId) => {
    try {
      await saleService.voidSale(saleId);
      enqueueSnackbar('Sale voided successfully!', { variant: 'info' });
      fetchSales();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to void sale', { variant: 'error' });
    }
  };

  const handleEditSale = async (saleId) => {
    try {
      const saleResponse = await saleService.getsale(saleId);
      if (saleResponse.success) {
        const sale = saleResponse.data;
        const customerResponse = await accountService.getAccountById(sale.customer._id);
        setSelectedSale({ ...sale, customer: customerResponse.data });
        setEditDialogOpen(true);
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to fetch sale details', { variant: 'error' });
    }
  };

  const handleOpenDeleteDialog = (saleId) => {
    setSaleToDelete(saleId);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSaleToDelete(null);
  };
  const handleCloseGroupSaleDialog = () => {
    setGroupSaleDialogOpen(false);
    fetchSales();
  };

  const handleDeleteSale = async () => {
    if (saleToDelete) {
      try {
        await saleService.deleteSale(saleToDelete);
        enqueueSnackbar('Sale deleted successfully!', { variant: 'success' });
        fetchSales();
      } catch (error) {
        enqueueSnackbar(error.message || 'Failed to delete sale', { variant: 'error' });
      } finally {
        handleCloseDeleteDialog();
      }
    }
  };

  const handlePrintSale = async (saleId) => {
    try {
      const response = await saleService.getsale(saleId);
      if (response.success) {
        setSelectedSale(response.data);
        setPrintDialogOpen(true);
      }
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to fetch invoice details', { variant: 'error' });
    }
  };

  return (
    <Box >
      <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
        <Grid item xs={12} sm={4}>
          <Typography variant="h4">Sales Management</Typography>
        </Grid>
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={(newValue) => setSelectedDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={5} md={3}>
              <Tooltip title="Add Sale">
                <Button 
                  variant="contained"
                  color="success"
                  onClick={() => setTransactionDialogOpen(true)}
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
            <Grid item xs={5} md={3}>
              <Tooltip title="Add Group Sale">
                <Button 
                  variant="contained"
                  color="success"
                  onClick={() => setGroupSaleDialogOpen(true)}
                  fullWidth
                >
                  {isMobile ? (
                    <GroupAddOutlined />
                  ) : (
                    <>Add Group Sale</>
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
        getRowId={(row) => row.id}
      />
      
      <AddTransactionDialog
        open={transactionDialogOpen}
        onClose={handleCloseSaleDialog}
        type="sale"
      />
      <CreateSaleDialog
        open={saleDialogOpen}
        onClose={handleCloseSaleDialog}
        sale={selectedSale}
      />
      <EditSaleDialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        sale={selectedSale}
      />
      <PrintInvoice
        open={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
        saleData={selectedSale}
      />
      <GroupSalesDialog
        open={groupSaleDialogOpen}
        onClose={handleCloseGroupSaleDialog}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete Sale
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to permanently delete this sale? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteSale} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sales;