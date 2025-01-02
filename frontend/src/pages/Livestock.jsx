import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  Card,
  Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useSnackbar } from 'notistack';
import * as livestockService from '../services/livestockService';

// Styled components for modern look
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
  '& .MuiTable-root': {
    borderCollapse: 'separate',
    borderSpacing: '0 8px',
  }
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: 'none',
  padding: theme.spacing(2),
  '&.header': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 600,
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  // Add subtle shadow to main category rows
  '&.category-row': {
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    '& > *': { borderBottom: 'none' }
  }
}));

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  }
}));

const CategoryRow = ({ category, items, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <StyledTableRow className="category-row">
        <StyledTableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
            sx={{ 
              transition: 'transform 0.3s',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          >
            <KeyboardArrowDownIcon />
          </IconButton>
        </StyledTableCell>
        <StyledTableCell component="th" scope="row">
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Typography>
        </StyledTableCell>
        <StyledTableCell align="right">
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            {totalQuantity}
          </Typography>
        </StyledTableCell>
        <StyledTableCell />
      </StyledTableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, ml: 4 }}>
              <Table size="small" aria-label="livestock">
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Type</StyledTableCell>
                    <StyledTableCell align="right">Quantity</StyledTableCell>
                    <StyledTableCell align="right">Actions</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <StyledTableRow key={item._id}>
                      <StyledTableCell component="th" scope="row">
                        {getTypeLabel(item.type)}
                      </StyledTableCell>
                      <StyledTableCell align="right">{item.quantity}</StyledTableCell>
                      <StyledTableCell align="right">
                        <ActionButton 
                          onClick={() => onEdit(item)}
                          size="small"
                          sx={{ color: 'primary.main' }}
                        >
                          <EditIcon />
                        </ActionButton>
                        <ActionButton 
                          onClick={() => onDelete(item._id)}
                          size="small"
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon />
                        </ActionButton>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const getTypeLabel = (type) => {
  const typeLabels = {
    cow: 'Cow (Female)',
    bull: 'Bull (Male)',
    calf: 'Calf (Young)',
    hen: 'Hen (Female)',
    rooster: 'Rooster (Male)',
    chick: 'Chick (Young)',
    ewe: 'Ewe (Female)',
    ram: 'Ram (Male)',
    lamb: 'Lamb (Young)'
  };
  return typeLabels[type] || type;
};

const Livestock = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [livestock, setLivestock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLivestock, setSelectedLivestock] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    type: '',
    quantity: '',
    notes: ''
  });

  const categories = {
    cattle: [
      { value: 'cow', label: 'Cow (Female)' },
      { value: 'bull', label: 'Bull (Male)' },
      { value: 'calf', label: 'Calf (Young)' }
    ],
    poultry: [
      { value: 'hen', label: 'Hen (Female)' },
      { value: 'rooster', label: 'Rooster (Male)' },
      { value: 'chick', label: 'Chick (Young)' }
    ],
    sheep: [
      { value: 'ewe', label: 'Ewe (Female)' },
      { value: 'ram', label: 'Ram (Male)' },
      { value: 'lamb', label: 'Lamb (Young)' }
    ]
  };

  useEffect(() => {
    fetchLivestock();
  }, []);

  const fetchLivestock = async () => {
    try {
      setLoading(true);
      const response = await livestockService.getAllLivestock();
      console.log('Livestock data:', response.data.data);
      if (response.data.success && Array.isArray(response.data.data)) {
        setLivestock(response.data.data);
      }
    } catch (error) {
      enqueueSnackbar('Failed to fetch livestock', { variant: 'error' });
      console.error('Error fetching livestock:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (livestock = null) => {
    if (livestock) {
      setSelectedLivestock(livestock);
      setFormData(livestock);
    } else {
      setSelectedLivestock(null);
      setFormData({
        category: '',
        type: '',
        quantity: '',
        notes: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLivestock(null);
    setFormData({
      category: '',
      type: '',
      quantity: '',
      notes: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        quantity: Number(formData.quantity)
      };

      if (selectedLivestock) {
        await livestockService.updateLivestock(selectedLivestock._id, submitData);
        enqueueSnackbar('Livestock updated successfully', { variant: 'success' });
      } else {
        await livestockService.addLivestock(submitData);
        enqueueSnackbar('Livestock added successfully', { variant: 'success' });
      }
      fetchLivestock();
      handleCloseDialog();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.error || 'Operation failed', { 
        variant: 'error' 
      });
      console.error('Error:', error.response?.data);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this livestock?')) {
      try {
        await livestockService.deleteLivestock(id);
        enqueueSnackbar('Livestock deleted successfully', { variant: 'success' });
        fetchLivestock();
      } catch (error) {
        enqueueSnackbar('Failed to delete livestock', { variant: 'error' });
      }
    }
  };

  const groupedLivestock = livestock.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <Box sx={{ p: 3 }}>
      <StyledCard>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 600,
              color: 'primary.main' 
            }}
          >
            Livestock Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3
            }}
          >
            Add Livestock
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <StyledTableContainer>
          <Table aria-label="collapsible table">
            <TableHead>
              <TableRow>
                <StyledTableCell className="header" />
                <StyledTableCell className="header">Category</StyledTableCell>
                <StyledTableCell className="header" align="right">Total Quantity</StyledTableCell>
                <StyledTableCell className="header" />
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(groupedLivestock).map(([category, items]) => (
                <CategoryRow
                  key={category}
                  category={category}
                  items={items}
                  onEdit={handleOpenDialog}
                  onDelete={handleDelete}
                />
              ))}
            </TableBody>
          </Table>
        </StyledTableContainer>
      </StyledCard>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedLivestock ? 'Edit Livestock' : 'Add New Livestock'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      category: e.target.value,
                      type: '' // Reset type when category changes
                    })}
                    label="Category"
                  >
                    {Object.keys(categories).map((category) => (
                      <MenuItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    label="Type"
                    disabled={!formData.category}
                  >
                    {formData.category &&
                      categories[formData.category].map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedLivestock ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Livestock; 