import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Container, Paper } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PurchaseList from '../salePurchase/PurchaseList';
import purchaseService from '../../services/purchaseService';
import AddTransactionDialog from '../../components/deAddTransactionDialog';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await purchaseService.getPurchases();
      setPurchases(response.data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePurchase = () => {
    setAddDialogOpen(true);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Purchases
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreatePurchase}
          >
            New Purchase
          </Button>
        </Box>

        <PurchaseList 
          purchases={purchases} 
          loading={loading} 
          onRefresh={fetchPurchases}
        />

        <AddTransactionDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          type="purchase"
        />
      </Box>
    </Container>
  );
};

export default Purchases; 