import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  TextField,
  Stack,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import SummarizeIcon from '@mui/icons-material/Summarize';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import customerService from '../services/customerService';
import CustomerLedgerSummary from './CustomerLedgerSummary';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import TableViewIcon from '@mui/icons-material/TableView';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

// Add this component for the export menu
const ExportMenu = ({ anchorEl, onClose, onExportExcel, onExportPDF }) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      sx={{ zIndex: 9999 }}
    >
      <MenuItem onClick={onExportExcel}>
        <ListItemIcon>
          <TableViewIcon fontSize="small" />
        </ListItemIcon>
        Export to Excel
      </MenuItem>
      <MenuItem onClick={onExportPDF}>
        <ListItemIcon>
          <PictureAsPdfIcon fontSize="small" />
        </ListItemIcon>
        Export to PDF
      </MenuItem>
    </Menu>
  );
};

const CustomerLedger = ({ open, onClose, customer }) => {
  const [loading, setLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const printRef = useRef(null);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  // Add an id to help with printing
  const printContentId = 'printable-ledger-content';

  useEffect(() => {
    if (open && customer?._id) {
      // Set default date range to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      setStartDate(firstDay);
      setEndDate(lastDay);
      
      // Fetch ledger data with default date range
      fetchLedgerData(firstDay, lastDay);
    }
  }, [open, customer]);

  const fetchLedgerData = async (start, end) => {
    try {
      setLoading(true);
      const response = await customerService.getCustomerLedger(
        customer._id,
        start?.toISOString(),
        end?.toISOString()
      );
      if (response.success) {
        setLedgerData(response.data);
      }
    } catch (error) {
      console.error('Error fetching ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = () => {
    if (!startDate || !endDate) {
      // Show error message using your notification system
      return;
    }
    
    // Set end date to end of day
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    fetchLedgerData(startDate, endOfDay);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(Math.abs(amount)).replace("₹", "₹ ");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fetchSummaryData = async () => {
    try {
      setSummaryLoading(true);
      const response = await customerService.getCustomerLedgerSummary(
        customer._id,
        startDate?.toISOString(),
        endDate?.toISOString()
      );
      if (response.success) {
        setSummaryData(response.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Ensure the ref is ready before printing
  const handlePrint = useReactToPrint({
    content: () => {
      const content = printRef.current;
      if (!content) {
        console.error('Print content not found');
        return null;
      }
      return content;
    },
    documentTitle: `Ledger_${customer?.name}_${new Date().toLocaleDateString()}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 20mm;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
      }
    `,
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        if (!ledgerData) {
          resolve();
          return;
        }
        // Force a re-render and wait for it to complete
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          resolve();
        }, 500);
      });
    },
    onPrintError: (error) => console.error('Print failed:', error),
  });

  // Add this new function for PDF formatting
  const formatAmountForPDF = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(Math.abs(amount))
      .replace("₹", "Rs."); // Replace ₹ with Rs.
  };

  const exportToExcel = () => {
    if (!ledgerData) return;

    // Prepare data for export
    const exportData = [
      // Headers
      ['Date', 'Particulars', 'DR', 'CR', 'Mode', 'Balance'],
      // Opening Balance row
      [
        formatDate(ledgerData.ledgerDetails[0]?.date),
        'Opening Balance',
        '-',
        '-',
        '-',
        formatAmount(ledgerData.startingBalance)
      ],
      // Transaction rows
      ...ledgerData.ledgerDetails.map(entry => [
        formatDate(entry.date),
        entry.description,
        entry.type === 'Transaction' ? formatAmount(Math.abs(entry.amount)) : '-',
        entry.type === 'Invoice' ? formatAmount(entry.amount) : '-',
        entry.transactionMode ? entry.transactionMode.replace('_', ' ').toUpperCase() : '-',
        formatAmount(entry.balanceAfterEntry)
      ]),
      // Closing Balance row
      ['', 'Closing Balance', '', '', '', formatAmount(ledgerData.currentBalance)]
    ];

    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ledger');

    // Generate filename
    const fileName = `Ledger_${customer?.name}_${new Date().toLocaleDateString()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportToPDF = () => {
    if (!ledgerData) return;

    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text('Customer Ledger', doc.internal.pageSize.width / 2, 15, { align: 'center' });

    // Add customer info
    doc.setFontSize(12);
    doc.text(`Customer: ${ledgerData.customerInfo.name}`, 15, 25);
    doc.text(`Period: ${startDate?.toLocaleDateString()} to ${endDate?.toLocaleDateString()}`, 15, 32);

    // Add balance info using the new format function
    doc.text(`Opening Balance: ${formatAmountForPDF(ledgerData.startingBalance)}`, 15, 39);
    doc.text(`Current Balance: ${formatAmountForPDF(ledgerData.currentBalance)}`, 15, 46);

    // Prepare table data with the new format function
    const tableData = ledgerData.ledgerDetails.map(entry => [
      formatDate(entry.date),
      entry.description,
      entry.type === 'Transaction' ? formatAmountForPDF(Math.abs(entry.amount)) : '-',
      entry.type === 'Invoice' ? formatAmountForPDF(entry.amount) : '-',
      entry.transactionMode ? entry.transactionMode.replace('_', ' ').toUpperCase() : '-',
      formatAmountForPDF(entry.balanceAfterEntry)
    ]);

    // Add table
    doc.autoTable({
      startY: 55,
      head: [['Date', 'Particulars', 'DR', 'CR', 'Mode', 'Balance']],
      body: [
        // Opening Balance row
        [formatDate(ledgerData.ledgerDetails[0]?.date), 'Opening Balance', '-', '-', '-', formatAmountForPDF(ledgerData.startingBalance)],
        // Transaction rows
        ...tableData,
        // Closing Balance row
        ['', 'Closing Balance', '', '', '', formatAmountForPDF(ledgerData.currentBalance)]
      ],
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] },
    });

    // Generate filename and save
    const fileName = `Ledger_${customer?.name}_${new Date().toLocaleDateString()}.pdf`;
    doc.save(fileName);
  };

  // Replace the existing export button with this new version
  const exportButton = (
    <>
      <Button
        startIcon={<DownloadIcon />}
        onClick={(event) => setExportAnchorEl(event.currentTarget)}
      >
        Export
      </Button>
      <ExportMenu
        anchorEl={exportAnchorEl}
        onClose={() => setExportAnchorEl(null)}
        onExportExcel={() => {
          exportToExcel();
          setExportAnchorEl(null);
        }}
        onExportPDF={() => {
          exportToPDF();
          setExportAnchorEl(null);
        }}
      />
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          '@media print': {
            position: 'static !important',
            overflow: 'visible !important',
            height: 'auto !important'
          }
        }
      }}
    >
      <DialogTitle className="no-print">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">Customer Ledger</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ 
        flex: 1, 
        overflow: 'auto',
        '@media print': {
          overflow: 'visible !important',
          height: 'auto !important'
        }
      }}>
        <div ref={printRef} style={{ width: '100%' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : ledgerData ? (
            <>
              {/* Date Range Selection - No Print */}
              <Box className="no-print" sx={{ mb: 3, '@media print': { display: 'none' } }}>
                <Card sx={{ p: 2 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={3}>
                        <DatePicker
                          label="From Date"
                          value={startDate}
                          onChange={setStartDate}
                          renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <DatePicker
                          label="To Date"
                          value={endDate}
                          onChange={setEndDate}
                          renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Button
                          variant="contained"
                          startIcon={<FilterAltIcon />}
                          onClick={handleDateRangeChange}
                          fullWidth
                        >
                          Filter
                        </Button>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                          <Button 
                            startIcon={<PrintIcon />}
                            onClick={handlePrint}
                            disabled={!ledgerData}
                          >
                            Print
                          </Button>
                          {exportButton}
                        </Stack>
                      </Grid>
                      <Grid item xs={12} md={1}>
                        <Button
                          variant="outlined"
                          startIcon={<SummarizeIcon />}
                          onClick={() => {
                            setShowSummary(true);
                            fetchSummaryData();
                          }}
                        >
                          View Summary
                        </Button>
                      </Grid>
                    </Grid>
                  </LocalizationProvider>
                </Card>
              </Box>

              {/* Printable Content */}
              <Box 
                id={printContentId}
                sx={{ 
                  p: 2,
                  '@media print': {
                    position: 'relative !important',
                    overflow: 'visible !important',
                    height: 'auto !important'
                  }
                }}
              >
                {/* Print Header */}
                <Box sx={{ 
                  mb: 4, 
                  display: 'none', 
                  '@media print': { 
                    display: 'block',
                    position: 'relative'
                  } 
                }}>
                  <Typography variant="h4" align="center" gutterBottom>
                    Customer Ledger
                  </Typography>
                  <Typography variant="h6" align="center" gutterBottom>
                    {`Period: ${startDate?.toLocaleDateString()} to ${endDate?.toLocaleDateString()}`}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                </Box>

                {/* Customer Info */}
                <Card sx={{ mb: 3, backgroundColor: '#f8f9fa' }}>
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="h6" gutterBottom color="primary">
                          {ledgerData.customerInfo.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Contact: {ledgerData.customerInfo.contactNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Address: {ledgerData.customerInfo.address}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={8}>
                        <Grid container spacing={2}>
                          <Grid item xs={6} md={4}>
                            <Card elevation={0} sx={{ backgroundColor: 'primary.light', p: 2 }}>
                              <Typography variant="subtitle2" color="primary.contrastText">
                                Opening Balance
                              </Typography>
                              <Typography variant="h6" color="primary.contrastText">
                                {formatAmount(ledgerData.startingBalance)}
                              </Typography>
                            </Card>
                          </Grid>
                          <Grid item xs={6} md={4}>
                            <Card elevation={0} sx={{ backgroundColor: 'secondary.light', p: 2 }}>
                              <Typography variant="subtitle2" color="secondary.contrastText">
                                Current Balance
                              </Typography>
                              <Typography variant="h6" color="secondary.contrastText">
                                {formatAmount(ledgerData.currentBalance)}
                              </Typography>
                            </Card>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Ledger Table */}
                <TableContainer component={Paper} sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell>Date</TableCell>
                        <TableCell>Particulars</TableCell>
                        <TableCell align="right">DR</TableCell>
                        <TableCell align="right">CR</TableCell>
                        <TableCell>Mode</TableCell>
                        <TableCell align="right">Balance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Opening Balance Row */}
                      <TableRow>
                        <TableCell>{formatDate(ledgerData.ledgerDetails[0]?.date)}</TableCell>
                        <TableCell><strong>Opening Balance</strong></TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell align="right">
                          <strong>{formatAmount(ledgerData.startingBalance)}</strong>
                        </TableCell>
                      </TableRow>

                      {ledgerData.ledgerDetails.map((entry, index) => (
                        <TableRow 
                          key={index}
                          sx={{
                            backgroundColor: entry.type === 'Invoice' 
                              ? 'rgba(76, 175, 80, 0.04)' 
                              : 'rgba(244, 67, 54, 0.04)'
                          }}
                        >
                          <TableCell>{formatDate(entry.date)}</TableCell>
                          <TableCell>{entry.description}</TableCell>
                          <TableCell align="right" sx={{ color: 'error.main' }}>
                            {entry.type === 'Transaction' ? formatAmount(Math.abs(entry.amount)) : '-'}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'success.main' }}>
                            {entry.type === 'Invoice' ? formatAmount(entry.amount) : '-'}
                          </TableCell>
                          <TableCell>
                            {entry.transactionMode 
                              ? entry.transactionMode.replace('_', ' ').toUpperCase() 
                              : '-'}
                          </TableCell>
                          <TableCell align="right">
                            {formatAmount(entry.balanceAfterEntry)}
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Closing Balance Row */}
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell colSpan={5}>
                          <strong>Closing Balance</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>{formatAmount(ledgerData.currentBalance)}</strong>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Summary Cards */}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ backgroundColor: 'success.light' }}>
                      <CardContent>
                        <Typography color="success.contrastText" gutterBottom>
                          Total Invoices (CR)
                        </Typography>
                        <Typography variant="h5" color="success.contrastText">
                          {formatAmount(
                            ledgerData.ledgerDetails
                              .filter(entry => entry.type === 'Invoice')
                              .reduce((sum, entry) => sum + entry.amount, 0)
                          )}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ backgroundColor: 'error.light' }}>
                      <CardContent>
                        <Typography color="error.contrastText" gutterBottom>
                          Total Payments (DR)
                        </Typography>
                        <Typography variant="h5" color="error.contrastText">
                          {formatAmount(Math.abs(
                            ledgerData.ledgerDetails
                              .filter(entry => entry.type === 'Transaction')
                              .reduce((sum, entry) => sum + entry.amount, 0)
                          ))}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </>
          ) : null}
        </div>
      </DialogContent>
      <CustomerLedgerSummary
        open={showSummary}
        onClose={() => setShowSummary(false)}
        summaryData={summaryData}
        loading={summaryLoading}
      />

      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #${printContentId}, 
            #${printContentId} * {
              visibility: visible;
              position: relative;
            }
            .no-print {
              display: none !important;
            }
            .MuiDialog-root {
              position: absolute !important;
              left: 0;
              top: 0;
            }
            .MuiDialog-paper {
              box-shadow: none !important;
              position: relative !important;
              transform: none !important;
            }
          }
        `}
      </style>
    </Dialog>
  );
};

export default CustomerLedger; 