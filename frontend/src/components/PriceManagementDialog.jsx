import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  Box,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import EditIcon from '@mui/icons-material/Edit';

const PriceManagementDialog = ({ open, onClose, items, onUpdatePrices, type }) => {
  const [prices, setPrices] = React.useState({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  React.useEffect(() => {
    const initialPrices = {};
    items.forEach(item => {
      initialPrices[item._id] = item.rate || 0;
    });
    setPrices(initialPrices);
  }, [items]);

  const handlePriceChange = (id, value) => {
    setPrices(prev => ({
      ...prev,
      [id]: parseFloat(value) || 0
    }));
  };

  const handleSubmit = () => {
    onUpdatePrices(prices);
    onClose();
  };

  const MobileView = () => (
    <Stack spacing={2}>
      {items.map((item) => (
        <Card key={item._id} variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {item.type || item.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CurrencyRupeeIcon fontSize="small" />
                <Typography>{item.rate || 0}</Typography>
              </Box>
            </Box>
            <TextField
              fullWidth
              type="number"
              label="New Price"
              value={prices[item._id] || 0}
              onChange={(e) => handlePriceChange(item._id, e.target.value)}
              InputProps={{
                startAdornment: <CurrencyRupeeIcon fontSize="small" sx={{ mr: 1 }} />,
              }}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </CardContent>
        </Card>
      ))}
    </Stack>
  );

  const DesktopView = () => (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CurrencyRupeeIcon fontSize="small" sx={{ mr: 0.5 }} />
              <Typography>Current Price</Typography>
            </Box>
          </TableCell>
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EditIcon fontSize="small" sx={{ mr: 0.5 }} />
              <Typography>New Price</Typography>
            </Box>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item._id}>
            <TableCell>{item.type || item.name}</TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CurrencyRupeeIcon fontSize="small" />
                <Typography>{item.rate || 0}</Typography>
              </Box>
            </TableCell>
            <TableCell>
              <TextField
                type="number"
                value={prices[item._id] || 0}
                onChange={(e) => handlePriceChange(item._id, e.target.value)}
                InputProps={{
                  startAdornment: <CurrencyRupeeIcon fontSize="small" sx={{ mr: 1 }} />,
                }}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CurrencyRupeeIcon sx={{ mr: 1 }} />
          <Typography>Manage {type} Prices</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {isMobile ? <MobileView /> : <DesktopView />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          startIcon={<CurrencyRupeeIcon />}
        >
          Update Prices
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PriceManagementDialog; 