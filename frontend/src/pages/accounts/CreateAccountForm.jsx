import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import accountService from '../../services/accountService';

const accountTypes = [
  "Sale",
  "Purchase",
  "Bank",
  "Cash",
  "Expense",
  "Customer",
  "Supplier",
  "Liability"
];

const balanceTypes = ["Debit", "Credit"];

const validationSchema = Yup.object().shape({
  accountType: Yup.string()
    .required('Account type is required')
    .oneOf(accountTypes, 'Invalid account type'),
    
  accountName: Yup.string().when('accountType', {
    is: (val) => !['Customer', 'Supplier'].includes(val),
    then: () => Yup.string().required('Account name is required'),
    otherwise: () => Yup.string()
  }),

  customerName: Yup.string().when('accountType', {
    is: 'Customer',
    then: () => Yup.string().required('Customer name is required'),
    otherwise: () => Yup.string()
  }),

  supplierName: Yup.string().when('accountType', {
    is: 'Supplier',
    then: () => Yup.string().required('Supplier name is required'),
    otherwise: () => Yup.string()
  }),

  email: Yup.string()
    .email('Invalid email format')
    .optional(),

  contactNo: Yup.string().when('accountType', {
    is: (val) => ['Customer', 'Supplier'].includes(val),
    then: () => Yup.string().required('Contact number is required'),
    otherwise: () => Yup.string()
  }),

  address: Yup.string().when('accountType', {
    is: (val) => ['Customer', 'Supplier'].includes(val),
    then: () => Yup.string().required('Address is required'),
    otherwise: () => Yup.string()
  }),

  balance: Yup.number()
    .required('Balance is required')
    .typeError('Balance must be a number'),

  balanceType: Yup.string()
    .required('Balance type is required')
    .oneOf(['Debit', 'Credit'], 'Invalid balance type'),

  note: Yup.string()
});

const StyledCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
}));

const CreateAccountForm = ({ defaultAccountType = '', onSave, onCancel, enqueueSnackbar }) => {
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      accountType: defaultAccountType,
      accountName: '',
      customerName: '',
      supplierName: '',
      email: '',
      contactNo: '',
      address: '',
      balance: 0,
      balanceType: 'Debit',
      note: '',
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);
        const submissionValues = {
          ...values,
          initialBalance: values.balanceType === 'Credit' 
            ? -Math.abs(values.balance) 
            : Math.abs(values.balance),
          balance: values.balanceType === 'Credit' 
            ? -Math.abs(values.balance) 
            : Math.abs(values.balance),
          accountName: isCustomerOrSupplier 
            ? values[`${values.accountType.toLowerCase()}Name`]
            : values.accountName,
        };
        const response = await accountService.createAccount(submissionValues);
        enqueueSnackbar('Account created successfully', { variant: 'success' });
        resetForm();
        if (onSave) onSave(response.data); // Pass only response.data
      } catch (error) {
        console.error('Error creating account:', error);
        enqueueSnackbar(error.message || 'Failed to create account', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    },
  });

  const isCustomerOrSupplier = ['Customer', 'Supplier'].includes(formik.values.accountType);

  useEffect(() => {
    console.log('Form Errors:', formik.errors);
    console.log('Form Valid:', formik.isValid);
    console.log('Form Values:', formik.values);
  }, [formik.errors, formik.isValid, formik.values]);

  return (
    <StyledCard>
      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          {/* Account Type Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required error={formik.touched.accountType && Boolean(formik.errors.accountType)}>
              <InputLabel>Account Type</InputLabel>
              <Select
                name="accountType"
                value={formik.values.accountType}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={defaultAccountType !== ''} // Disable if pre-set
                label="Account Type"
              >
                {accountTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Show Account Name only for non-Customer/Supplier types */}
          {!isCustomerOrSupplier && (
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                name="accountName"
                label="Account Name"
                value={formik.values.accountName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.accountName && Boolean(formik.errors.accountName)}
                helperText={formik.touched.accountName && formik.errors.accountName}
              />
            </Grid>
          )}

          {/* Customer/Supplier Specific Fields */}
          {isCustomerOrSupplier && (
            <>
              <Grid item xs={12}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}
                >
                  {formik.values.accountType} Details
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  name={`${formik.values.accountType.toLowerCase()}Name`}
                  label={`${formik.values.accountType} Name`}
                  value={formik.values.accountType === 'Customer' 
                    ? formik.values.customerName 
                    : formik.values.supplierName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched[`${formik.values.accountType.toLowerCase()}Name`] && 
                    Boolean(formik.errors[`${formik.values.accountType.toLowerCase()}Name`])}
                  helperText={formik.touched[`${formik.values.accountType.toLowerCase()}Name`] && 
                    formik.errors[`${formik.values.accountType.toLowerCase()}Name`]}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  name="email"
                  label="Email"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  name="contactNo"
                  label="Contact Number"
                  value={formik.values.contactNo}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.contactNo && Boolean(formik.errors.contactNo)}
                  helperText={formik.touched.contactNo && formik.errors.contactNo}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  name="address"
                  label="Address"
                  multiline
                  rows={2}
                  value={formik.values.address}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.address && Boolean(formik.errors.address)}
                  helperText={formik.touched.address && formik.errors.address}
                />
              </Grid>
            </>
          )}

          {/* Balance Information */}
          <Grid item xs={12}>
            <Typography 
              variant="subtitle1" 
              sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}
            >
              Balance Information
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              required
              fullWidth
              name="balance"
              label="Balance"
              type="number"
              value={formik.values.balance}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.balance && Boolean(formik.errors.balance)}
              helperText={formik.touched.balance && formik.errors.balance}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl 
              fullWidth 
              required
              error={formik.touched.balanceType && Boolean(formik.errors.balanceType)}
            >
              <InputLabel>Balance Type</InputLabel>
              <Select
                name="balanceType"
                value={formik.values.balanceType}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                label="Balance Type"
              >
                {balanceTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Notes - Optional */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              name="note"
              label="Notes (Optional)"
              multiline
              rows={3}
              value={formik.values.note}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </Grid>

          {/* Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
              {onCancel && (
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  sx={{ height: '40px', borderRadius: '20px', px: 4 }}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !formik.isValid}
                sx={{
                  height: '40px',
                  borderRadius: '20px',
                  px: 4,
                  boxShadow: 2,
                  '&:hover': { boxShadow: 4 }
                }}
              >
                Create Account
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </StyledCard>
  );
};

export default CreateAccountForm;