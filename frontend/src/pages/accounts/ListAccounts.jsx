import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  Chip,
  Button,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AddIcon from '@mui/icons-material/Add';
import { useSnackbar } from 'notistack';
import useResponsiveness from '../../hooks/useResponsive';
import accountService from '../../services/accountService';
import MainLayout from '../../layouts/MainLayout';
import { useNavigate } from 'react-router-dom';

// Styled components
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
  '& .MuiTable-root': {
    borderCollapse: 'separate',
    borderSpacing: '0 8px',
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: 'none',
  padding: theme.spacing(2),
  '&.header': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 600,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  '& > *': { borderBottom: 'none' },
}));

// Helper function to determine Dr/Cr based on account type
const getBalanceLabel = (account) => {
  if (account.accountType === "Sale") {
    console.log("this is sale account", account);
  }

  const normalBalanceMap = {
    'Sale': 'Cr',        // Revenue: Positive = Cr, Negative = Dr
    'Purchase': 'Dr',
    'Bank': 'Dr',
    'Cash': 'Dr',
    'Expense': 'Dr',
    'Customer': 'Dr',
    'Supplier': 'Cr',
    'Liability': 'Cr'
  };

  const normalBalance = normalBalanceMap[account.accountType] || 'Dr';
  const balance = Number(account.balance); // Ensure balance is a number
  const label = (normalBalance === 'Cr') 
    ? (balance >= 0 ? 'Cr' : 'Dr') 
    : (balance >= 0 ? 'Dr' : 'Cr');
  return label;
};

// Category Row Component
const CategoryRow = ({ category, accounts, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const { isMobile } = useResponsiveness();
  const navigate = useNavigate();

  const handleLedgerClick = (account) => {
    navigate(`/accounts/${account._id}/ledger`, { 
      state: { 
        account: {
          ...account,
          accountName: account.accountName,
          accountType: account.accountType,
          openingBalance: account.openingBalance,
          openingBalanceType: account.openingBalanceType,
        } 
      }
    });
  };

  const handleCreateClick = () => {
    navigate('/accounts/create', { state: { defaultAccountType: category } });
  };

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
        <StyledTableCell component="th" scope="row">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 500 }}>
              {category}
            </Typography>
          </Box>
        </StyledTableCell>
        <StyledTableCell align="right">
          <Chip 
            label={`${accounts.length} Account${accounts.length !== 1 ? 's' : ''}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </StyledTableCell>
      </StyledTableRow>
      
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Button
              variant="contained"
              size="small"
              onClick={handleCreateClick}
              startIcon={<AddIcon />}
              sx={{
                width: '100%',
                textTransform: 'none',
                alignSelf: 'center',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none',
                  bgcolor: 'primary.dark',
                }
              }}
            >
              {`Add New ${category} Account`}
            </Button>
            <Box sx={{ margin: 1, ml: 4 }}>
              <Table size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Account Name</StyledTableCell>
                    <StyledTableCell>Details</StyledTableCell>
                    <StyledTableCell align="right">Balance</StyledTableCell>
                    <StyledTableCell align="right">Actions</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accounts.map((account) => (
                    <StyledTableRow 
                      key={account._id}
                      onClick={() => handleLedgerClick(account)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <StyledTableCell>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {account.accountName}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        {account.email && (
                          <Typography variant="caption" color="textSecondary" display="block">
                            {account.email}
                          </Typography>
                        )}
                        {account.contactNo && (
                          <Typography variant="caption" color="textSecondary" display="block">
                            {account.contactNo}
                          </Typography>
                        )}
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 500,
                            color: account.balance >= 0 ? 'success.main' : 'error.main'
                          }}
                        >
                          ₹{Math.abs(account.balance).toLocaleString()}
                          <Typography 
                            component="span" 
                            variant="caption" 
                            sx={{ ml: 0.5, color: 'text.secondary' }}
                          >
                            {getBalanceLabel(account)}
                          </Typography>
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Tooltip title="View Ledger">
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLedgerClick(account);
                              }}
                            >
                              <ReceiptLongIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(account);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(account._id);
                              }}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
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

// Main ListAccounts Component
const ListAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { isMobile } = useResponsiveness();
  const navigate = useNavigate();

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await accountService.getAllAccounts();
      console.log('Fetched Accounts:', response.data);
      setAccounts(response.data);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to fetch accounts', { 
        variant: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Group accounts by type
  const groupedAccounts = accounts.reduce((acc, account) => {
    if (!acc[account.accountType]) {
      acc[account.accountType] = [];
    }
    acc[account.accountType].push(account);
    return acc;
  }, {});

  const handleEdit = (account) => {
    console.log('Edit account:', account);
    // Example: navigate('/accounts/edit', { state: { account } });
  };

  const handleDelete = async (id) => {
    try {
      await accountService.deleteAccount(id);
      enqueueSnackbar('Account deleted successfully', { variant: 'success' });
      fetchAccounts();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to delete account', { 
        variant: 'error' 
      });
    }
  };

  return (
    <MainLayout>
      <Box sx={{ p: isMobile ? 1 : 3 }}>
        <Box sx={{ 
          backgroundColor: 'background.paper',
          borderRadius: 2,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
          p: isMobile ? 2 : 3
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3
          }}>
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              sx={{ fontWeight: 600, color: 'primary.main' }}
            >
              Accounts List
            </Typography>
            <Tooltip title="Refresh">
              <IconButton 
                onClick={fetchAccounts}
                disabled={loading}
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
          </Box>

          <Divider sx={{ mb: 3 }} />

          <StyledTableContainer>
            <Table size={isMobile ? "small" : "medium"}>
              <TableBody>
                {Object.entries(groupedAccounts).map(([category, categoryAccounts]) => (
                  <CategoryRow
                    key={category}
                    category={category}
                    accounts={categoryAccounts}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </TableBody>
            </Table>
          </StyledTableContainer>
        </Box>
      </Box>
    </MainLayout>
  );
};

export default ListAccounts;