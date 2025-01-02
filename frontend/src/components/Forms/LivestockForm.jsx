import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';

const validationSchema = Yup.object({
  type: Yup.string().required('Type is required'),
  gender: Yup.string().required('Gender is required'),
  age: Yup.number().required('Age is required').min(0, 'Age must be positive'),
  weight: Yup.number().required('Weight is required').min(0, 'Weight must be positive'),
  status: Yup.string().required('Status is required'),
});

const LivestockForm = ({ onClose, onSubmit, initialValues }) => {
  const formik = useFormik({
    initialValues: initialValues || {
      type: '',
      gender: '',
      age: '',
      weight: '',
      status: 'healthy',
    },
    validationSchema,
    onSubmit: async (values) => {
      await onSubmit(values);
      onClose();
    },
  });

  return (
    <Box>
      <DialogTitle>
        {initialValues ? 'Edit Livestock' : 'Add New Livestock'}
      </DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <TextField
            fullWidth
            id="type"
            name="type"
            label="Type"
            margin="normal"
            select
            value={formik.values.type}
            onChange={formik.handleChange}
            error={formik.touched.type && Boolean(formik.errors.type)}
            helperText={formik.touched.type && formik.errors.type}
          >
            <MenuItem value="cow">Cow</MenuItem>
            <MenuItem value="sheep">Sheep</MenuItem>
            <MenuItem value="goat">Goat</MenuItem>
            <MenuItem value="chicken">Chicken</MenuItem>
          </TextField>

          <TextField
            fullWidth
            id="gender"
            name="gender"
            label="Gender"
            margin="normal"
            select
            value={formik.values.gender}
            onChange={formik.handleChange}
            error={formik.touched.gender && Boolean(formik.errors.gender)}
            helperText={formik.touched.gender && formik.errors.gender}
          >
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
          </TextField>

          <TextField
            fullWidth
            id="age"
            name="age"
            label="Age (months)"
            type="number"
            margin="normal"
            value={formik.values.age}
            onChange={formik.handleChange}
            error={formik.touched.age && Boolean(formik.errors.age)}
            helperText={formik.touched.age && formik.errors.age}
          />

          <TextField
            fullWidth
            id="weight"
            name="weight"
            label="Weight (kg)"
            type="number"
            margin="normal"
            value={formik.values.weight}
            onChange={formik.handleChange}
            error={formik.touched.weight && Boolean(formik.errors.weight)}
            helperText={formik.touched.weight && formik.errors.weight}
          />

          <TextField
            fullWidth
            id="status"
            name="status"
            label="Status"
            margin="normal"
            select
            value={formik.values.status}
            onChange={formik.handleChange}
            error={formik.touched.status && Boolean(formik.errors.status)}
            helperText={formik.touched.status && formik.errors.status}
          >
            <MenuItem value="healthy">Healthy</MenuItem>
            <MenuItem value="sick">Sick</MenuItem>
            <MenuItem value="pregnant">Pregnant</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            {initialValues ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Box>
  );
};

export default LivestockForm; 