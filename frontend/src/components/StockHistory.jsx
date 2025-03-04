import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Box
} from '@mui/material';
import * as stockMovementService from '../services/stockMovementService';

const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

const StockHistory = ({ itemId, itemType }) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMovements = async () => {
      setLoading(true);
      try {
        const response = itemType === 'Product' 
          ? await stockMovementService.getProductMovements(itemId)
          : await stockMovementService.getLivestockMovements(itemId);
        setMovements(response.data);
      } catch (error) {
        console.error('Error fetching movements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovements();
  }, [itemId, itemType]);

  const getTransactionTypeColor = (type) => {
    const types = {
      'Sale': 'error',
      'Purchase': 'success',
      'Initial': 'primary',
      'Adjustment': 'warning',
      'birth': 'success',
      'death': 'error'
    };
    return types[type] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell>Previous Stock</TableCell>
            <TableCell>Current Stock</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {movements.map((movement) => (
            <TableRow key={movement._id}>
              <TableCell>{formatDate(movement.date)}</TableCell>
              <TableCell>
                <Chip 
                  label={movement.transactionType}
                  color={getTransactionTypeColor(movement.transactionType)}
                  size="small"
                />
              </TableCell>
              <TableCell>{movement.quantity}</TableCell>
              <TableCell>{movement.previousStock}</TableCell>
              <TableCell>{movement.currentStock}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default StockHistory; 