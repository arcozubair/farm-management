import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  CardHeader,
  Chip,
  CircularProgress
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { productService } from '../services/productService';
import { alpha } from '@mui/material/styles';

// Single product card with expandable details
const ProductCard = ({ product, onUpdate }) => {
  const [open, setOpen] = useState(false);

  const formatDateTime = (dateString) => {
    // Create date object in local timezone
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN'),
      // Use hour12 true to show AM/PM format
      time: date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      })
    };
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        title={`${product.type.charAt(0).toUpperCase() + product.type.slice(1)}`}
        subheader={`Current Stock: ${product.currentStock} ${product.type === 'milk' ? 'L' : 'Pcs'}`}
        action={
          <IconButton onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        }
      />

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Collection History
          </Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Previous Stock</TableCell>
                  <TableCell align="right">Current Stock</TableCell>
                  <TableCell>Shift</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {product.stockHistory
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((entry, index) => {
                    const { date, time } = formatDateTime(entry.date);
                    return (
                      <TableRow 
                        key={index}
                        sx={{
                          backgroundColor: entry.transactionType === 'sale' 
                            ? alpha('#ff0000', 0.1)
                            : alpha('#4caf50', 0.1)
                        }}
                      >
                        <TableCell>{date}</TableCell>
                        <TableCell>{time}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={entry.transactionType}
                            color={entry.transactionType === 'sale' ? 'error' : 'success'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {entry.quantity} {product.type === 'milk' ? 'L' : 'Pcs'}
                        </TableCell>
                        <TableCell align="right">
                          {entry.previousStock} {product.type === 'milk' ? 'L' : 'Pcs'}
                        </TableCell>
                        <TableCell align="right">
                          {entry.currentStock} {product.type === 'milk' ? 'L' : 'Pcs'}
                        </TableCell>
                        <TableCell>{entry.shift || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Summary Section */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Total Collections
                  </Typography>
                  <Typography variant="h6">
                    {product.stockHistory
                      .filter(entry => entry.transactionType === 'collection')
                      .reduce((sum, entry) => sum + entry.quantity, 0)}
                    {' '}{product.type === 'milk' ? 'L' : 'Pcs'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Total Sales
                  </Typography>
                  <Typography variant="h6">
                    {product.stockHistory
                      .filter(entry => entry.transactionType === 'sale')
                      .reduce((sum, entry) => sum + entry.quantity, 0)}
                    {' '}{product.type === 'milk' ? 'L' : 'Pcs'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Current Stock
                  </Typography>
                  <Typography variant="h6">
                    {product.currentStock} {product.type === 'milk' ? 'L' : 'Pcs'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Collapse>
    </Card>
  );
};

// Main ProductList component
const ProductList = ({ products, loading, onProductUpdate }) => {
  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      {products.map((product) => (
        <ProductCard 
          key={product._id} 
          product={product}
          onUpdate={onProductUpdate}
        />
      ))}
    </Box>
  );
};

export { ProductCard };
export default ProductList;