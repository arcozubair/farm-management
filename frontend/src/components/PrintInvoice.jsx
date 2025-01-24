import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
  IconButton,
  DialogTitle,
  CircularProgress
} from '@mui/material';
import { Close as CloseIcon, Print as PrintIcon } from '@mui/icons-material';
import { getCompanySettings } from '../services/companySettingsService';
import { numberToWords } from '../utils/numberToWords';
import useResponsiveness from '../hooks/useResponsive';
import { useReactToPrint } from "react-to-print";

const globalStyles = `
  @media print {
    @page {
      size: A4;
      margin: 0;
    }
    body {
      margin: 0;
    }
  }
`;

const PrintInvoice = ({ open, onClose, invoiceData }) => {
  const [companyDetails, setCompanyDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isMobile, isTablet, isDesktop } = useResponsiveness();
  const componentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice_${invoiceData?.invoiceNumber || 'Print'}`,
    onBeforeGetContent: () => {
      if (!componentRef.current) {
        return Promise.reject('Printing content not ready');
      }
      return Promise.resolve();
    },
    onPrintError: (error) => {
      console.error('Print failed:', error);
    },
    removeAfterPrint: true,
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        .MuiDialog-paper {
          box-shadow: none !important;
        }
      }
    `
  });

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const response = await getCompanySettings();
        setCompanyDetails(response.data);
      } catch (error) {
        console.error('Error fetching company details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchCompanyDetails();
    }
  }, [open]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = globalStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  console.log('invoiceData:', invoiceData);

  if (!invoiceData || loading) return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      </DialogContent>
    </Dialog>
  );

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatAddress = (address) => {
    if (!address) return '';
    const {line1, line2, city, state, pincode} = address;
    return [
      line1,
      line2,
      `${city}, ${state} - ${pincode}`
    ].filter(Boolean).join(', ');
  };

  const declaration = "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.";

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          width: '100%',
          margin: isMobile ? 1 : isTablet ? 2 : 3,
          maxWidth: isMobile ? '100%' : isTablet ? '600px' : '900px'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 1 : 0
      }}>
        <Typography variant={isMobile ? "subtitle1" : "h6"}>Invoice Preview</Typography>
        <Box>
          <IconButton 
            onClick={handlePrint}
            color="primary"
            size={isMobile ? "small" : "medium"}
          >
            <PrintIcon />
          </IconButton>
          <IconButton 
            onClick={onClose}
            size={isMobile ? "small" : "medium"}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <div 
          ref={componentRef}
          style={{ 
            width: '100%',
            height: '100%'
          }}
        >
          <Box sx={{ 
            p: isMobile ? 1 : 2,
            '@media print': {
              padding: 0,
              margin: 0
            }
          }}>
            <Paper elevation={0} sx={{ 
              p: isMobile ? 1 : isTablet ? 2 : 3, 
              border: '2px solid #000', 
              height: isMobile ? 'auto' : '27.7cm',
              fontFamily: 'Calibri',
              '@media print': {
                boxShadow: 'none',
                margin: 0
              }
            }}>
              {/* Header */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 2 : 0,
                mb: 2
              }}>
                {/* Left side - Company Details */}
                <Box sx={{ width: isMobile ? '100%' : '60%' }}>
                  <Typography 
                    variant={isMobile ? "h6" : "h5"} 
                    sx={{ 
                      textTransform: 'uppercase', 
                      fontWeight: 'bold',
                      letterSpacing: '0.05em',
                      fontSize: isMobile ? '1rem' : isTablet ? '1.25rem' : '1.5rem'
                    }}
                  >
                    {companyDetails?.companyName}
                  </Typography>
                  <Typography variant="body1">
                    {formatAddress(companyDetails?.address)}
                  </Typography>
                  <Typography variant="body1">
                    Phone: {companyDetails?.contactNumbers?.map(phone => phone).join(', ')}
                  </Typography>
                  {companyDetails?.gstNumber && (
                    <Typography variant="body1">
                      GSTIN: {companyDetails.gstNumber}
                    </Typography>
                  )}
                </Box>

                {/* Right side - Invoice Details */}
                <Box sx={{ 
                  width: isMobile ? '100%' : '40%',
                  mt: isMobile ? 2 : 0 
                }}>
                  <Typography variant={isMobile ? "h5" : "h4"} sx={{ 
                    fontWeight: 'bold',
                    letterSpacing: '0.1em',
                    borderBottom: '3px double #000',
                    pb: 1,
                    mb: 2
                  }}>
                    TAX INVOICE
                  </Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>
                    Invoice No: {invoiceData.invoiceNumber}
                  </Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>
                    Date: {formatDate(invoiceData.createdAt)}
                  </Typography>
                </Box>
              </Box>

              {/* Party Details */}
              <Box sx={{ mb: 3, border: '1px solid #000', p: 2 }}>
                <Typography sx={{ fontWeight: 'bold', mb: 1 }}>Party Details:</Typography>
                <Typography>Name: {invoiceData.customer?.name}</Typography>
                <Typography>Contact: {invoiceData.customer?.contactNumber || 'N/A'}</Typography>
              </Box>

              {/* Items Table */}
              <Box sx={{ 
                overflowX: isMobile ? 'auto' : 'hidden',
                maxWidth: '100%'
              }}>
                <Table sx={{ 
                  borderCollapse: 'collapse',
                  minWidth: isMobile ? '600px' : 'auto',
                  '& th, & td': { 
                    border: '1px solid #000',
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                    padding: isMobile ? '4px' : '8px',
                    fontFamily: 'Calibri',
                    whiteSpace: isMobile ? 'nowrap' : 'normal'
                  }
                }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8f8f8' }}>
                      <TableCell width="5%">Sr.</TableCell>
                      <TableCell width="35%">Particulars</TableCell>
                      <TableCell align="right" width="15%">Quantity</TableCell>
                      <TableCell align="right" width="15%">Weight</TableCell>
                      <TableCell align="right" width="15%">Rate</TableCell>
                      <TableCell align="right" width="15%">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoiceData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.name.charAt(0).toUpperCase() + item.name.slice(1)}</TableCell>
                        <TableCell align="right">
                          {item.quantity} {item.unit === "kg" ? "" :item.unit}
                        </TableCell>
                        <TableCell align="right">
                          {item?.weight || '-'} {item?.weight ? item.unit : ''}
                        </TableCell>
                        <TableCell align="right">₹{item.price?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell align="right">₹{((item.total || 0)).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>

              {/* Adjust the spacer to be flexible */}
              <Box sx={{ 
                flexGrow: 1, 
                minHeight: '20px',
                maxHeight: '150px'  // Limit maximum height
              }} />

              

              {/* Totals Section */}
              <Box sx={{ 
                borderTop: '1px solid #000',
                pt: 2,
                width: '100%',
                mt: 'auto'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  mb: 1,
                  flexDirection: isMobile ? 'column' : 'row'
                }}>
                  <Box sx={{ 
                    width: isMobile ? '100%' : '50%', 
                    pr: isMobile ? 0 : 2 
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontWeight: 'bold', fontFamily: 'Calibri' }}>Sub Total:</Typography>
                      <Typography sx={{ fontFamily: 'Calibri' }}>₹{(invoiceData.grandTotal - (invoiceData.gstAmount || 0)).toFixed(2)}</Typography>
                    </Box>
                    {invoiceData.gstPercentage > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{ fontWeight: 'bold', fontFamily: 'Calibri' }}>GST ({invoiceData.gstPercentage}%):</Typography>
                        <Typography sx={{ fontFamily: 'Calibri' }}>₹{invoiceData.gstAmount?.toFixed(2) || '0.00'}</Typography>
                      </Box>
                    )}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      borderTop: '2px solid #000',
                      pt: 1,
                      mt: 1
                    }}>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem', fontFamily: 'Calibri' }}>Grand Total:</Typography>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '1.1rem', fontFamily: 'Calibri' }}>
                        ₹{invoiceData.grandTotal?.toFixed(2) || '0.00'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Footer */}
                <Box sx={{ 
                  mt: 4,
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #000',
                  pt: 2
                }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', fontFamily: 'Calibri' }}>
                      {companyDetails?.termsAndConditions}
                    </Typography>
                  </Box>
                 
                </Box>
              </Box>

              {/* Declaration and Signatures */}
          

{/* Declaration and Authorized Signatory on same line */}
<Box sx={{ 
  mt: 4,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end'  // Aligns items to bottom of container
}}>
  {/* Declaration */}
  <Box sx={{ maxWidth: '60%' }}>
    <Typography sx={{ 
      fontStyle: 'italic', 
      fontSize: '0.9rem'
    }}>
      {declaration}
    </Typography>
  </Box>

  {/* Authorized Signatory */}
  <Box sx={{ textAlign: 'center' }}>
   
  </Box>
</Box>

{/* Signatures Section */}
<Box sx={{ 
  display: 'flex', 
  justifyContent: 'space-between',
  mt: 4,
  pt: 2,
  flexDirection: isMobile ? 'column' : 'row',
  gap: isMobile ? 2 : 0
}}>
 

  {/* Company Section */}
  <Box sx={{ 
    width: '100%', 
    textAlign: 'right',
    border: '1px solid #000', 
    px: 1
  }}>
    <Typography sx={{ 
      fontWeight: 'bold',
      fontSize: isMobile ? '0.9rem' : '1rem'
    }}>
      For {companyDetails?.companyName}
    </Typography>
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between',
      gap: 1,
      py: 4,
      pb: 0,
      flexDirection: isMobile ? 'column' : 'row',
      '& .MuiTypography-root': {
        fontSize: isMobile ? '0.8rem' : '1rem'
      }
    }}>
        <Box sx={{  mt: 1, pt: 1, }}>
      <Typography>Customer's Seal & Signature</Typography>
    </Box>
      <Box sx={{  mt: 1, pt: 1, flex: 1 }}>
        <Typography>Prepared by</Typography>
      </Box>
      <Box sx={{  mt: 1, pt: 1, flex: 1 }}>
        <Typography>Verified by</Typography>
      </Box>
      <Box sx={{  mt: 1, pt: 1, flex: 1 }}>
      <Typography >
        Authorized Signatory
      </Typography>
    </Box>
    </Box>
  </Box>
</Box>

{/* Terms and Conditions */}
<Box sx={{ 
  mt: 2,
  pt: 1,
  borderTop: '1px solid #000',
  fontSize: '0.8rem'
}}>
  <Typography variant="body2" sx={{ fontStyle: 'italic',textAlign:'right' }}>
 E. & O.E.
  </Typography>
</Box>



              {/* Terms and Conditions */}
              <Box sx={{ 
                mt: 2,
                pt: 1,
                borderTop: '1px solid #000',
                fontSize: '0.8rem'
              }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic', textAlign:'center' }}>
                This a Computer Generated Invoice
                </Typography>
              </Box>
            </Paper>
          </Box>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintInvoice;