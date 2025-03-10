import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress,
  Box
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  Print as PrintIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const PurchaseList = ({ purchases, loading, onRefresh }) => {
  const navigate = useNavigate();

  const handleViewPurchase = (purchase) => {
    navigate(`/purchases/${purchase._id}`, { state: { purchase } });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Purchase No.</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Supplier</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell align="right">Paid</TableCell>
            <TableCell align="right">Balance</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {purchases.map((purchase) => (
            <TableRow key={purchase._id}>
              <TableCell>{purchase.purchaseNumber}</TableCell>
              <TableCell>
                {format(new Date(purchase.date), 'dd/MM/yyyy')}
              </TableCell>
              <TableCell>{purchase.supplier?.name}</TableCell>
              <TableCell align="right">
                ₹{purchase.grandTotal.toLocaleString('en-IN')}
              </TableCell>
              <TableCell align="right">
                ₹{purchase.paidAmount.toLocaleString('en-IN')}
              </TableCell>
              <TableCell align="right">
                ₹{purchase.remainingBalance.toLocaleString('en-IN')}
              </TableCell>
              <TableCell align="center">
                <Tooltip title="View Details">
                  <IconButton 
                    size="small"
                    onClick={() => handleViewPurchase(purchase)}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Print">
                  <IconButton size="small">
                    <PrintIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PurchaseList; 