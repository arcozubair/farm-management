import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';

const validationSchema = Yup.object({
  customer: Yup.string().required('Customer is required'),
  items: Yup.array().of(
    Yup.object({
      itemType: Yup.string().required('Item type is required'),
      item: Yup.string().required('Item is required'),
      quantity: Yup.number()
        .required('Quantity is required')
        .min(1, 'Quantity must be at least 1'),
      unitPrice: Yup.number()
        .required('Unit price is required')
        .min(0, 'Unit price must be positive'),
    })
  ),
  paymentMethod: Yup.string().required('Payment method is required'),
  paidAmount: Yup.number()
    .min(0, 'Paid amount must be positive')
    .required('Paid amount is required'),
});

const InvoiceForm = ({ open, onClose, onSubmit, customers, livestock, products }) => {
  const formik = useFormik({
    initialValues: {
      customer: '',
      items: [{ itemType: '', item: '', quantity: 1, unitPrice: 0 }],
      paymentMethod: 'cash',
      paidAmount: 0,
      notes: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit(values);
        onClose();
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const addItem = () => {
    formik.setFieldValue('items', [
      ...formik.values.items,
      { itemType: '', item: '', quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeItem = (index) => {
    const items = [...formik.values.items];
    items.splice(index, 1);
    formik.setFieldValue('items', items);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Invoice</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            {/* Customer Selection */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                name="customer"
                label="Customer"
                value={formik.values.customer}
                onChange={formik.handleChange}
                error={formik.touched.customer && Boolean(formik.errors.customer)}
                helperText={formik.touched.customer && formik.errors.customer}
              >
                {customers.map((customer) => (
                  <MenuItem key={customer._id} value={customer._id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Items */}
            {formik.values.items.map((item, index) => (
              <Grid item xs={12} key={index}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      select
                      name={`items.${index}.itemType`}
                      label="Item Type"
                      value={item.itemType}
                      onChange={formik.handleChange}
                    >
                      <MenuItem value="livestock">Livestock</MenuItem>
                      <MenuItem value="product">Product</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      select
                      name={`items.${index}.item`}
                      label="Item"
                      value={item.item}
                      onChange={formik.handleChange}
                    >
                      {item.itemType === 'livestock'
                        ? livestock.map((l) => (
                            <MenuItem key={l._id} value={l._id}>
                              {l.type} - {l.gender}
                            </MenuItem>
                          ))
                        : products.map((p) => (
                            <MenuItem key={p._id} value={p._id}>
                              {p.type}
                            </MenuItem>
                          ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      fullWidth
                      type="number"
                      name={`items.${index}.quantity`}
                      label="Quantity"
                      value={item.quantity}
                      onChange={formik.handleChange}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      fullWidth
                      type="number"
                      name={`items.${index}.unitPrice`}
                      label="Unit Price"
                      value={item.unitPrice}
                      onChange={formik.handleChange}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <IconButton onClick={() => removeItem(index)}>
                      <RemoveIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Button startIcon={<AddIcon />} onClick={addItem}>
                Add Item
              </Button>
            </Grid>

            {/* Payment Details */}
            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                name="paymentMethod"
                label="Payment Method"
                value={formik.values.paymentMethod}
                onChange={formik.handleChange}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="bank">Bank</MenuItem>
                <MenuItem value="credit">Credit</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                name="paidAmount"
                label="Paid Amount"
                value={formik.values.paidAmount}
                onChange={formik.handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="notes"
                label="Notes"
                value={formik.values.notes}
                onChange={formik.handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting ? 'Creating...' : 'Create Invoice'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default InvoiceForm; 