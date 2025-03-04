import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { getCompanySettings, updateCompanySettings } from '../services/companySettingsService';
import { useSnackbar } from 'notistack';

const validationSchema = Yup.object({
  companyName: Yup.string().required('Company name is required'),
  address: Yup.object({
    line1: Yup.string().required('Address line 1 is required'),
    city: Yup.string().required('City is required'),
    state: Yup.string().required('State is required'),
    pincode: Yup.string().required('Pincode is required')
  }),
  contactNumbers: Yup.array().of(Yup.string()).min(1, 'At least one contact number is required'),
  gstNumber: Yup.string(),
  termsAndConditions: Yup.string(),
  prefixes: Yup.object({
    invoicePrefix: Yup.string().required('Invoice prefix is required'),
    transactionPrefix: Yup.string().required('Transaction prefix is required'),
    receiptPrefix: Yup.string().required('Receipt prefix is required')
  }),
  numberSequences: Yup.object({
    lastSaleNumber: Yup.number().required('Last invoice number is required'),
    lastTransactionNumber: Yup.number().required('Last transaction number is required'),
    lastReceiptNumber: Yup.number().required('Last receipt number is required')
  })
});

const CompanySettings = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const formik = useFormik({
    initialValues: {
      companyName: '',
      address: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        pincode: ''
      },
      contactNumbers: [''],
      gstNumber: '',
      gstPercentage: 0,
      termsAndConditions: '',
      prefixes: {
        invoicePrefix: '',
        transactionPrefix: '',
        receiptPrefix: ''
      },
      numberSequences: {
        lastSaleNumber: 0,
        lastTransactionNumber: 0,
        lastReceiptNumber: 0
      }
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setError(null);
        await updateCompanySettings(values);
        enqueueSnackbar('Settings updated successfully', { variant: 'success' });
      } catch (err) {
        setError(err.message || 'Failed to update settings');
      }
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        console.log('Fetching company settings...');
        const response = await getCompanySettings();
        console.log('Settings received:', response);
        if (response.success && response.data) {
          formik.setValues({
            ...formik.values,
            ...response.data
          });
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError(err.message || 'Failed to fetch settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  console.log('Rendering CompanySettings component', { loading, error });

  if (loading) {
    return (
      <Box display="flex" >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, m: 2 }}>
      <Typography variant="h5" gutterBottom>
        Company Settings
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          {/* Company Basic Info */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Basic Information
            </Typography>
            <TextField
              fullWidth
              label="Company Name"
              name="companyName"
              value={formik.values.companyName}
              onChange={formik.handleChange}
              error={formik.touched.companyName && Boolean(formik.errors.companyName)}
              helperText={formik.touched.companyName && formik.errors.companyName}
            />
          </Grid>

          {/* Address Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Address Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address Line 1"
                  name="address.line1"
                  value={formik.values.address.line1}
                  onChange={formik.handleChange}
                  error={formik.touched.address?.line1 && Boolean(formik.errors.address?.line1)}
                  helperText={formik.touched.address?.line1 && formik.errors.address?.line1}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address Line 2"
                  name="address.line2"
                  value={formik.values.address.line2}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="City"
                  name="address.city"
                  value={formik.values.address.city}
                  onChange={formik.handleChange}
                  error={formik.touched.address?.city && Boolean(formik.errors.address?.city)}
                  helperText={formik.touched.address?.city && formik.errors.address?.city}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="State"
                  name="address.state"
                  value={formik.values.address.state}
                  onChange={formik.handleChange}
                  error={formik.touched.address?.state && Boolean(formik.errors.address?.state)}
                  helperText={formik.touched.address?.state && formik.errors.address?.state}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Pincode"
                  name="address.pincode"
                  value={formik.values.address.pincode}
                  onChange={formik.handleChange}
                  error={formik.touched.address?.pincode && Boolean(formik.errors.address?.pincode)}
                  helperText={formik.touched.address?.pincode && formik.errors.address?.pincode}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Contact Numbers */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Contact Numbers
            </Typography>
            {formik.values.contactNumbers.map((number, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label={`Contact Number ${index + 1}`}
                  name={`contactNumbers.${index}`}
                  value={number}
                  onChange={formik.handleChange}
                />
                {index > 0 && (
                  <Button
                    color="error"
                    variant="outlined"
                    onClick={() => {
                      const newNumbers = formik.values.contactNumbers.filter((_, i) => i !== index);
                      formik.setFieldValue('contactNumbers', newNumbers);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </Box>
            ))}
            <Button
              variant="outlined"
              onClick={() => {
                formik.setFieldValue('contactNumbers', [...formik.values.contactNumbers, '']);
              }}
            >
              Add Contact Number
            </Button>
          </Grid>

          {/* GST Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Tax Information
            </Typography>
            <TextField
              fullWidth
              label="GST Number"
              name="gstNumber"
              value={formik.values.gstNumber}
              onChange={formik.handleChange}
            />
          </Grid>

          {/* Document Settings */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Document Settings
            </Typography>
            <Grid container spacing={3}>
              {/* Invoice Settings */}
              <Grid item xs={12} md={4}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Invoice Settings
                  </Typography>
                  <TextField
                    fullWidth
                    label="Invoice Prefix"
                    name="prefixes.invoicePrefix"
                    value={formik.values.prefixes.invoicePrefix}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.prefixes?.invoicePrefix && 
                      Boolean(formik.errors.prefixes?.invoicePrefix)
                    }
                    helperText={
                      formik.touched.prefixes?.invoicePrefix && 
                      formik.errors.prefixes?.invoicePrefix
                    }
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Current Invoice Number"
                    name="numberSequences.lastSaleNumber"
                    type="number"
                    value={formik.values.numberSequences.lastSaleNumber}
                    onChange={formik.handleChange}
                    InputProps={{
                      readOnly: true,
                      sx: { bgcolor: 'action.hover' }
                    }}
                  />
                </Paper>
              </Grid>

              {/* Transaction Settings */}
              <Grid item xs={12} md={4}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Transaction Settings
                  </Typography>
                  <TextField
                    fullWidth
                    label="Transaction Prefix"
                    name="prefixes.transactionPrefix"
                    value={formik.values.prefixes.transactionPrefix}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.prefixes?.transactionPrefix && 
                      Boolean(formik.errors.prefixes?.transactionPrefix)
                    }
                    helperText={
                      formik.touched.prefixes?.transactionPrefix && 
                      formik.errors.prefixes?.transactionPrefix
                    }
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Current Transaction Number"
                    name="numberSequences.lastTransactionNumber"
                    type="number"
                    value={formik.values.numberSequences.lastTransactionNumber}
                    onChange={formik.handleChange}
                    InputProps={{
                      readOnly: true,
                      sx: { bgcolor: 'action.hover' }
                    }}
                  />
                </Paper>
              </Grid>

              {/* Receipt Settings */}
              <Grid item xs={12} md={4}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Receipt Settings
                  </Typography>
                  <TextField
                    fullWidth
                    label="Receipt Prefix"
                    name="prefixes.receiptPrefix"
                    value={formik.values.prefixes.receiptPrefix}
                    onChange={formik.handleChange}
                    error={
                      formik.touched.prefixes?.receiptPrefix && 
                      Boolean(formik.errors.prefixes?.receiptPrefix)
                    }
                    helperText={
                      formik.touched.prefixes?.receiptPrefix && 
                      formik.errors.prefixes?.receiptPrefix
                    }
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Current Receipt Number"
                    name="numberSequences.lastReceiptNumber"
                    type="number"
                    value={formik.values.numberSequences.lastReceiptNumber}
                    onChange={formik.handleChange}
                    InputProps={{
                      readOnly: true,
                      sx: { bgcolor: 'action.hover' }
                    }}
                  />
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          {/* Terms and Conditions */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Terms and Conditions
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Terms and Conditions"
              name="termsAndConditions"
              value={formik.values.termsAndConditions}
              onChange={formik.handleChange}
            />
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={formik.isSubmitting}
              sx={{ mt: 2 }}
            >
              {formik.isSubmitting ? <CircularProgress size={24} /> : 'Save Settings'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default CompanySettings; 