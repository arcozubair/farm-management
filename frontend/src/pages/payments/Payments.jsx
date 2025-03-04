import React, { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Typography,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Payment as PaymentIcon,
  CompareArrows as TransferIcon,
  CallReceived as ReceiveIcon,
  CallMade as GiveIcon,
} from '@mui/icons-material';
import PaymentDialog from './PaymentDialog';
import TransferDialog from './TransferDialog';
import useResponsiveness from '../../hooks/useResponsive';
import { Container } from '@mui/system';
import MainLayout from '../../layouts/MainLayout';

const Payments = () => {
  const { isMobile } = useResponsiveness();
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(null);
  const [paymentType, setPaymentType] = useState(null);

  const handleOpenDialog = (type, pType = null) => {
    setDialogType(type);
    setPaymentType(pType);
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setDialogType(null);
    setPaymentType(null);
  };

  return (
    <MainLayout>
      <Container maxWidth="lg">
        <Box sx={{ p: 3 }}>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            sx={{ 
              fontWeight: 600,
              color: 'primary.main',
              letterSpacing: '-0.5px',
              mb: 4
            }}
          >
            Payment Management
          </Typography>

          <Paper 
            elevation={0}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #f6f9fc 0%, #ffffff 100%)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
            }}
          >
            {/* Header Section */}
            <Box 
              sx={{
                p: 4,
                background: 'linear-gradient(135deg, #4E73DF 0%, #224abe 100%)',
                color: 'white',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Create New Transaction
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Select the type of transaction you want to create
              </Typography>
            </Box>

            {/* Buttons Section */}
            <Box sx={{ p: 4 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<ReceiveIcon />}
                    onClick={() => handleOpenDialog('payment', 'receive')}
                    sx={{
                      py: 2,
                      px: 4,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                      boxShadow: '0 4px 15px rgba(46, 204, 113, 0.2)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #27ae60 0%, #219a52 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(46, 204, 113, 0.3)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Stack spacing={0.5} alignItems="flex-start">
                      <Typography variant="subtitle1" fontWeight={600}>
                        Payment Received
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Record a payment from customer
                      </Typography>
                    </Stack>
                  </Button>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<GiveIcon />}
                    onClick={() => handleOpenDialog('payment', 'give')}
                    sx={{
                      py: 2,
                      px: 4,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                      boxShadow: '0 4px 15px rgba(231, 76, 60, 0.2)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #c0392b 0%, #a93224 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(231, 76, 60, 0.3)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Stack spacing={0.5} alignItems="flex-start">
                      <Typography variant="subtitle1" fontWeight={600}>
                        Payment Given
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Record a payment to supplier
                      </Typography>
                    </Stack>
                  </Button>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', px: 2 }}>
                      OR
                    </Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<TransferIcon />}
                    onClick={() => handleOpenDialog('transfer')}
                    sx={{
                      py: 2,
                      px: 4,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #f39c12 0%, #d35400 100%)',
                      boxShadow: '0 4px 15px rgba(243, 156, 18, 0.2)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #d35400 0%, #c44e00 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(243, 156, 18, 0.3)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Stack spacing={0.5} alignItems="flex-start">
                      <Typography variant="subtitle1" fontWeight={600}>
                        Cash/Bank Transfer
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Transfer between accounts
                      </Typography>
                    </Stack>
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Dialogs */}
          <PaymentDialog
            open={openDialog && dialogType === 'payment'}
            onClose={handleClose}
            paymentType={paymentType}
          />
          <TransferDialog
            open={openDialog && dialogType === 'transfer'}
            onClose={handleClose}
          />
        </Box>
      </Container>
    </MainLayout>
  );
};

export default Payments;