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
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useSnackbar } from 'notistack';
import livestockService from '../services/livestockService';
import { useAuth } from '../context/AuthContext';
import PriceManagementDialog from '../components/PriceManagementDialog';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import useResponsiveness from '../hooks/useResponsive';
import RefreshIcon from '@mui/icons-material/Refresh';

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

const CategoryRow = ({ category, items, onEdit, onDelete, permissions }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const { isMobile, isTablet } = useResponsiveness();


  // Group items by subcategory
  const groupedItems = items.reduce((acc, item) => {
    let subcategory;
    if (category === 'cattle') {
      if (item.type.includes('Calf')) {
        subcategory = 'Calves';
      } else {
        subcategory = 'Adult Cattle';
      }
    } else if (category === 'sheep') {
      if (item.type.includes('Lamb')) {
        subcategory = 'Lambs';
      } else {
        subcategory = 'Adult Sheep';
      }
    } else {
      subcategory = 'All'; // For poultry, keep it simple
    }
    
    if (!acc[subcategory]) {
      acc[subcategory] = [];
    }
    acc[subcategory].push(item);
    return acc;
  }, {});

  return (
    <>
      <StyledTableRow className="category-row">
        <StyledTableCell sx={{ p: isMobile ? 1 : 2 }}>
          <IconButton
            aria-label="expand row"
            size={isMobile ? "small" : "medium"}
            onClick={() => setOpen(!open)}
            sx={{ 
              transition: 'transform 0.3s',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          >
            <KeyboardArrowDownIcon />
          </IconButton>
        </StyledTableCell>
        <StyledTableCell 
          component="th" 
          scope="row"
          sx={{ p: isMobile ? 1 : 2 }}
        >
          <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 500 }}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Typography>
        </StyledTableCell>
        <StyledTableCell 
          align="right"
          sx={{ p: isMobile ? 1 : 2 }}
        >
          <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 500 }}>
            {totalQuantity}
          </Typography>
        </StyledTableCell>
      </StyledTableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: isMobile ? 0.5 : 1, ml: isMobile ? 2 : 4 }}>
              {Object.entries(groupedItems).map(([subcategory, subcategoryItems]) => (
                <Box key={subcategory} sx={{ mb: isMobile ? 2 : 3 }}>
                  {category !== 'poultry' && (
                    <Typography
                      variant={isMobile ? "body2" : "subtitle1"}
                      sx={{
                        fontWeight: 600,
                        color: 'primary.main',
                        mb: 1
                      }}
                    >
                      {subcategory}
                    </Typography>
                  )}
                  <Table size={isMobile ? "small" : "medium"} aria-label="livestock">
                    <TableHead>
                      <TableRow>
                        <StyledTableCell sx={{ p: isMobile ? 1 : 2 }}>Type</StyledTableCell>
                        <StyledTableCell align="right" sx={{ p: isMobile ? 1 : 2 }}>Quantity</StyledTableCell>
                        {(permissions.canEdit || permissions.canDelete) && (
                          <StyledTableCell align="right" sx={{ p: isMobile ? 1 : 2 }}>Actions</StyledTableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {subcategoryItems.map((item) => (
                        <StyledTableRow key={item._id}>
                          <StyledTableCell 
                            component="th" 
                            scope="row"
                            sx={{ 
                              p: isMobile ? 1 : 2,
                              fontSize: isMobile ? '0.875rem' : 'inherit'
                            }}
                          >
                            {getTypeLabel(item.type)}
                          </StyledTableCell>
                          <StyledTableCell 
                            align="right"
                            sx={{ 
                              p: isMobile ? 1 : 2,
                              fontSize: isMobile ? '0.875rem' : 'inherit'
                            }}
                          >
                            {item.quantity}
                          </StyledTableCell>
                          {(permissions.canEdit || permissions.canDelete) && (
                            <StyledTableCell 
                              align="right"
                              sx={{ p: isMobile ? 0.5 : 2 }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                {permissions.canEdit && (
                                  <ActionButton 
                                    onClick={() => onEdit(item)}
                                    size={isMobile ? "small" : "medium"}
                                    sx={{ color: 'primary.main' }}
                                  >
                                    <EditIcon fontSize={isMobile ? "small" : "medium"} />
                                  </ActionButton>
                                )}
                                {permissions.canDelete && (
                                  <ActionButton 
                                    onClick={() => onDelete(item._id)}
                                    size={isMobile ? "small" : "medium"}
                                    sx={{ color: 'error.main' }}
                                  >
                                    <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
                                  </ActionButton>
                                )}
                              </Box>
                            </StyledTableCell>
                          )}
                        </StyledTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              ))}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const getTypeLabel = (type) => {
  const typeLabels = {
    // Cattle
    cow: 'Cow (Female)',
    bull: 'Bull (Male)',
    maleCalf: 'Calf (Male)',
    femaleCalf: 'Calf (Female)',
    
    // Poultry (unchanged)
    hen: 'Hen (Female)',
    rooster: 'Rooster (Male)',
    chick: 'Chick (Young)',
    
    // Sheep
    femaleSheep: 'Sheep (Female)',
    maleSheep: 'Sheep (Male)',
    maleLamb: 'Lamb (Male)',
    femaleLamb: 'Lamb (Female)'
  };
  return typeLabels[type] || type;
};

const Livestock = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [livestockToDelete, setLivestockToDelete] = useState(null);
  const [existingQuantity, setExistingQuantity] = useState(0);
  const [openPriceDialog, setOpenPriceDialog] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const categories = {
    cattle: [
      { value: 'cow', label: 'Cow (Female)' },
      { value: 'bull', label: 'Bull (Male)' },
      { value: 'maleCalf', label: 'Calf (Male)' },
      { value: 'femaleCalf', label: 'Calf (Female)' }
    ],
    poultry: [
      { value: 'hen', label: 'Hen (Female)' },
      { value: 'rooster', label: 'Rooster (Male)' },
      { value: 'chick', label: 'Chick (Young)' }
    ],
    sheep: [
      { value: 'femaleSheep', label: 'Sheep (Female)' },
      { value: 'maleSheep', label: 'Sheep (Male)' },
      { value: 'maleLamb', label: 'Lamb (Male)' },
      { value: 'femaleLamb', label: 'Lamb (Female)' }
    ]
  };
console.log("user permissions", user);
  // Check if user exists and has permissions
  const userPermissions = {
    canView: user?.permissions?.canView || false,
    canCreate: user?.permissions?.canCreate || false,
    canEdit: user?.permissions?.canEdit || false,
    canDelete: user?.permissions?.canDelete || false
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

  const getExistingQuantity = (category, type) => {
    if (!category || !type) return 0;
    const existingItem = livestock.find(
      item => item.category === category && item.type === type
    );
    return existingItem ? existingItem.quantity : 0;
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev };

      if (field === 'quantity') {
        // Prevent negative values
        const numValue = Number(value);
        if (numValue < 0) return prev; // Don't update if negative
        newData[field] = value;
      } else {
        newData[field] = value;
        
        // If category or type changes, update existing quantity
        if (field === 'category' || field === 'type') {
          const qty = getExistingQuantity(
            field === 'category' ? value : newData.category,
            field === 'type' ? value : newData.type
          );
          setExistingQuantity(qty);
        }
        
        // Reset type if category changes
        if (field === 'category') {
          newData.type = '';
        }
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        quantity: Number(formData.quantity)
      };

      const existingLivestock = livestock.find(
        item => item.category === formData.category && item.type === formData.type
      );

      if (existingLivestock && !selectedLivestock) {
        const updatedQuantity = existingLivestock.quantity + Number(formData.quantity);
        await livestockService.updateLivestock(existingLivestock._id, {
          ...existingLivestock,
          quantity: updatedQuantity,
          notes: formData.notes || existingLivestock.notes
        });
        enqueueSnackbar('Livestock quantity updated successfully', { variant: 'success' });
      } else {
        if (selectedLivestock) {
          await livestockService.updateLivestock(selectedLivestock._id, submitData);
          enqueueSnackbar('Livestock updated successfully', { variant: 'success' });
        } else {
          await livestockService.addLivestock(submitData);
          enqueueSnackbar('Livestock added successfully', { variant: 'success' });
        }
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

  const handleDeleteClick = (id) => {
    setLivestockToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setLivestockToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      await livestockService.deleteLivestock(livestockToDelete);
      enqueueSnackbar('Livestock deleted successfully', { variant: 'success' });
      fetchLivestock();
      setDeleteDialogOpen(false);
      setLivestockToDelete(null);
    } catch (error) {
      enqueueSnackbar('Failed to delete livestock', { variant: 'error' });
    }
  };

  const groupedLivestock = livestock.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const handleUpdatePrices = async (prices) => {
    try {
      setLoading(true);
      await livestockService.updateLivestockPrices(prices);
      // Refresh the livestock list
      await fetchLivestock();
      enqueueSnackbar('Prices updated successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error updating prices:', error);
      enqueueSnackbar(error.message || 'Failed to update prices', { variant: 'error' });

    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      <StyledCard sx={{ p: isMobile ? 1 : 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'row',
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: isMobile ? 1 : 3,
          gap: isMobile ? 1 : 2
        }}>
          <Typography 
            variant={isMobile ? "h6" : "h4"}
            sx={{ 
              fontWeight: 600,
              color: 'primary.main',
            }}
          >
            {isMobile ? "Livestock" : "Livestock Management"}
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            flexShrink: 0
          }}>
            <Tooltip title="Refresh">
              <IconButton
                onClick={fetchLivestock}
                size="small"
                sx={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'background.paper',
                  boxShadow: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Manage Prices">
              <IconButton
                onClick={() => setOpenPriceDialog(true)}
                size="small"
                sx={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'background.paper',
                  boxShadow: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <CurrencyRupeeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {userPermissions.canCreate && (
              <Tooltip title="Add Livestock">
                <IconButton
                  onClick={() => handleOpenDialog()}
                  size="small"
                  sx={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    boxShadow: 1,
                    '&:hover': {
                      backgroundColor: 'primary.dark'
                    }
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        <Divider sx={{ mb: isMobile ? 1 : 3 }} />

        <StyledTableContainer sx={{ 
          '& .MuiTableCell-root': {
            p: isMobile ? 0.5 : 2
          },
          '& .MuiTableCell-alignRight': {
            pr: isMobile ? 2 : 3
          }
        }}>
          <Table 
            aria-label="collapsible table"
            size={isMobile ? "small" : "medium"}
          >
            <TableHead>
              <TableRow>
                <StyledTableCell className="header" />
                <StyledTableCell className="header">Category</StyledTableCell>
                <StyledTableCell 
                  className="header" 
                  align="right" 
                  sx={{ pr: isMobile ? 2 : 3 }}
                >
                  Total Quantity
                </StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(groupedLivestock).map(([category, items]) => (
                <CategoryRow
                  key={category}
                  category={category}
                  items={items}
                  onEdit={userPermissions.canEdit ? handleOpenDialog : undefined}
                  onDelete={userPermissions.canDelete ? handleDeleteClick : undefined}
                  permissions={userPermissions}
                />
              ))}
            </TableBody>
          </Table>
        </StyledTableContainer>
      </StyledCard>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
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
                    onChange={(e) => handleFormChange('category', e.target.value)}
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
                    onChange={(e) => handleFormChange('type', e.target.value)}
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
              {existingQuantity > 0 && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Existing Quantity"
                    value={existingQuantity}
                    disabled
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={existingQuantity > 0 ? "Additional Quantity" : "Quantity"}
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleFormChange('quantity', e.target.value)}
                  inputProps={{ 
                    min: 0,
                    onKeyDown: (e) => {
                      if (e.key === '-' || e.key === 'e') {
                        e.preventDefault();
                      }
                    }
                  }}
                  helperText={existingQuantity > 0 ? `Total after adding: ${existingQuantity + Number(formData.quantity || 0)}` : ''}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedLivestock ? 'Update' : existingQuantity > 0 ? 'Add to Existing' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ pb: 1 }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this livestock? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteCancel}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <PriceManagementDialog
        open={openPriceDialog}
        onClose={() => setOpenPriceDialog(false)}
        items={livestock}
        onUpdatePrices={handleUpdatePrices}
        type="Livestock"
      />
    </Box>
  );
};

export default Livestock; 