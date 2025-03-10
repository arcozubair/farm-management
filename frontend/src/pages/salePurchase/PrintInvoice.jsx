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
import { getCompanySettings } from '../../services/companySettingsService';
import { numberToWords } from '../../utils/numberToWords';
import useResponsiveness from '../../hooks/useResponsive';
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

const PrintInvoice = ({ open, onClose, saleData }) => {
  const [companyDetails, setCompanyDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const componentRef = useRef(null);
  const { isMobile, isTablet, isDesktop } = useResponsiveness();

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice_${saleData?.saleNumber || 'Print'}`,
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

  console.log('saleData:', saleData);

  if (!saleData || loading) return (
    <Dialog open={open} onClose={onClose} fullWidth fullScreen>
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

  const declaration = "We declare that this invoice shows the actual rate of the goods described and that all particulars are true and correct.";

  // Desktop version of the invoice content
  const invoiceContent = (isPreview = false) => (
    <Box sx={{ p:0 }}>
      <Paper elevation={0} sx={{ 
        p: isPreview && (isMobile || isTablet) ? 2 : 3, 
        border: '2px solid #000', 
        height: isPreview && (isMobile || isTablet) ? 'auto' : '27.7cm',
        fontFamily: 'Calibri',
        width: '100%',
        // Add responsive styles for preview
        ...(isPreview && (isMobile || isTablet) && {
          transform: 'scale(0.9)',
          transformOrigin: 'top center',
        })
      }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 'bold',
          textAlign: 'center',
          letterSpacing: '0.1em',
          pb: 1,
          mb: 2,
          fontSize: isPreview && isMobile ? '1.5rem' : '2rem'
        }}>
          INVOICE
        </Typography>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isPreview && isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          border: '1px solid #000',
          p: isPreview && (isMobile || isTablet) ? 0 : 2,
          mb: 2,
          gap: isPreview && isMobile ? 2 : 0
        }}>
          {/* Left side - Company Details */}
          <Box sx={{ 
            width: isPreview && isMobile ? '100%' : '60%'
          }}>
            <Typography variant="h6" sx={{ 
              textTransform: 'uppercase', 
              fontWeight: 'bold',
              letterSpacing: '0.05em',
              fontSize: isPreview && isMobile ? '1rem' : '1.3rem',
              mb: 2
            }}>
              {companyDetails?.companyName}
            </Typography>
            <Typography variant="body1" sx={{ 
              fontSize: isPreview && isMobile ? '0.8rem' : '0.9rem' 
            }}>
              {formatAddress(companyDetails?.address)}
            </Typography>
            <Typography variant="body1" sx={{ 
              fontSize: isPreview && isMobile ? '0.8rem' : '0.9rem'
            }}>
              Phone: {companyDetails?.contactNumbers?.map(phone => phone).join(', ')}
            </Typography>
            {companyDetails?.gstNumber && (
              <Typography variant="body1" sx={{ 
                fontSize: isPreview && isMobile ? '0.8rem' : '0.9rem'
              }}>
                GSTIN: {companyDetails.gstNumber}
              </Typography>
            )}
          </Box>
          {/* Right side - Invoice Details */}
          <Box sx={{ 
            width: isPreview && isMobile ? '100%' : '40%'
          }}>
            <Typography sx={{ 
              fontWeight: 'bold',
              fontSize: isPreview && isMobile ? '0.8rem' : '0.9rem'
            }}>
              Invoice No: {saleData.saleNumber}
            </Typography>
            <Typography sx={{ 
              fontWeight: 'bold', 
              mb: 1,
              fontSize: isPreview && isMobile ? '0.8rem' : '0.9rem'
            }}>
              Date: {formatDate(saleData.createdAt)}
            </Typography>
            <Typography sx={{ 
              fontWeight: 'bold', 
              textDecoration: 'underline',
              fontSize: isPreview && isMobile ? '0.8rem' : '0.9rem'
            }}>
              Party Details:
            </Typography>
            <Typography sx={{ 
              fontWeight: 'bold',
              fontSize: isPreview && isMobile ? '0.8rem' : '0.9rem'
            }}>
              Name: {saleData.customer?.customerName}
            </Typography>
            <Typography sx={{ 
              fontWeight: 'bold',
              fontSize: isPreview && isMobile ? '0.8rem' : '0.9rem'
            }}>
              Contact: {saleData.customer?.contactNo || 'N/A'}
            </Typography>
          </Box>
        </Box>
        {/* Items Table */}
        <Box sx={{ 
          overflowX:'auto',
          maxWidth: '100%'
        }}>
          <Table sx={{ 
            borderCollapse: 'collapse',
            minWidth: 'auto',
            '& th, & td': { 
            
              fontSize: '0.9rem',
              padding:'8px',
              fontFamily: 'Calibri',
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
              {saleData.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{item.name.charAt(0).toUpperCase() + item.name.slice(1)}</TableCell>
                  <TableCell align="right">
                    {item.quantity} {item.unit === "kg" ? "" :item.unit}
                  </TableCell>
                  <TableCell align="right">
                    {item?.weight || '-'} {item?.weight ? item.unit : ''}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>₹{item.rate?.toFixed(2) || '0.00'}</TableCell>
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
          }}>
          <Box sx={{ 
    mt: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end'  // Aligns items to bottom of container
}}>
  {/* Declaration */}
  <Box sx={{ maxWidth: '80%' }}>
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
          <Box sx={{ 
            width: '50%', 
            pr:  2 
          }}>
            
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontWeight: 'bold', fontFamily: 'Calibri' }}>Sub Total:</Typography>
                <Typography sx={{ fontFamily: 'Calibri' }}>₹{(saleData.grandTotal - (saleData.gstAmount || 0)).toFixed(2)}</Typography>
              </Box>
              {saleData.gstPercentage > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontWeight: 'bold', fontFamily: 'Calibri' }}>GST ({saleData.gstPercentage}%):</Typography>
                  <Typography sx={{ fontFamily: 'Calibri' }}>₹{saleData.gstAmount?.toFixed(2) || '0.00'}</Typography>
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
                  ₹{saleData.grandTotal?.toFixed(2) || '0.00'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        {/* Signatures Section */}
        <Box sx={{ 
          mt: 4,
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: '1px solid #000',
          pt: 2
        }}>
          <Box sx={{ 
            width: '100%', 
            textAlign: 'right',
            border: '1px solid #000', 
            px: 1
          }}>
            <Typography sx={{ 
              fontWeight: 'bold', 
              fontSize: isPreview && isMobile ? '0.8rem' : '1rem',
              textAlign: 'right'
            }}>
              For {companyDetails?.companyName}
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              gap: 1,
              py: 4,
              pb: 0
            }}>
              <Box sx={{ mt: 1, pt: 1 }}>
                <Typography sx={{ 
                  fontSize: isPreview && isMobile ? '0.7rem' : '0.9rem'
                }}>
                  Customer's Seal & Signature
                </Typography>
              </Box>
              <Box sx={{ mt: 1, pt: 1 }}>
                <Typography sx={{ 
                  fontSize: isPreview && isMobile ? '0.7rem' : '0.9rem'
                }}>
                  Prepared by
                </Typography>
              </Box>
              <Box sx={{ mt: 1, pt: 1 }}>
                <Typography sx={{ 
                  fontSize: isPreview && isMobile ? '0.7rem' : '0.9rem'
                }}>
                  Verified by
                </Typography>
              </Box>
              <Box sx={{ mt: 1, pt: 1 }}>
                <Typography sx={{ 
                  fontSize: isPreview && isMobile ? '0.7rem' : '0.9rem'
                }}>
                  Authorized Signatory
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        {/* Terms and Computer Generated Notice */}
        <Box sx={{ 
          mt: 2,
          pt: 1,
          borderTop: '1px solid #000',
          fontSize: isPreview && isMobile ? '0.7rem' : '0.8rem'
        }}>
          <Typography variant="body2" sx={{ 
            fontStyle: 'italic', 
            textAlign: 'center',
            fontSize: isPreview && isMobile ? '0.7rem' : '0.8rem'
          }}>
            {companyDetails?.termsAndConditions}
          </Typography>
          <Typography variant="body2" sx={{ 
            fontStyle: 'italic', 
            textAlign: 'center',
            mt: 1,
            fontSize: isPreview && isMobile ? '0.7rem' : '0.8rem'
          }}>
            This is a Computer Generated Invoice
          </Typography>
        </Box>
      </Paper>
    </Box>
  );

  return (
    <>
      {/* Hidden div for printing - always uses desktop layout */}
      <div style={{ display: 'none' }}>
        <div ref={componentRef}>
          {invoiceContent(false)} {/* Pass false for print version */}
        </div>
      </div>

      {/* Visible dialog */}
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
          alignItems: 'center'
        }}>
          <Typography variant="h6">Invoice Preview</Typography>
          <Box>
            <IconButton onClick={handlePrint} color="primary">
              <PrintIcon />
            </IconButton>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {invoiceContent(true)} {/* Pass true for preview version */}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PrintInvoice;