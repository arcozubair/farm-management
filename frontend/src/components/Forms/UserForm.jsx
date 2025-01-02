import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
} from '@mui/material';

const validationSchema = Yup.object({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  role: Yup.string().required('Role is required'),
});

const PERMISSION_OPTIONS = [
  ['canView', 'View'],
  ['canCreate', 'Create'],
  ['canEdit', 'Edit'],
  ['canDelete', 'Delete'],
  ['canAssignPermissions', 'Assign Permissions'],
  ['canRevokePermissions', 'Revoke Permissions']
];

const UserForm = ({ onSubmit, onClose }) => {
  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
      name: '',
      email: '',
      role: '',
      permissions: {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canAssignPermissions: false,
        canRevokePermissions: false
      }
    },
    validationSchema,
    onSubmit: async (values) => {
      await onSubmit(values);
      formik.resetForm();
    },
  });

  // Handle role change and update permissions accordingly
  const handleRoleChange = (event) => {
    const newRole = event.target.value;
    formik.setFieldValue('role', newRole);
    
    if (newRole === 'admin') {
      // Set all permissions to true for admin
      const allPermissions = PERMISSION_OPTIONS.reduce((acc, [key]) => ({
        ...acc,
        [key]: true
      }), {});
      formik.setFieldValue('permissions', allPermissions);
    } else {
      // For user/employee role, only set view permission to true
      const defaultPermissions = PERMISSION_OPTIONS.reduce((acc, [key]) => ({
        ...acc,
        [key]: key === 'canView' // Only canView will be true
      }), {});
      formik.setFieldValue('permissions', defaultPermissions);
    }
  };

  // Handle individual permission changes
  const handlePermissionChange = (permission) => {
    formik.setFieldValue(`permissions.${permission}`, 
      !formik.values.permissions[permission]);
  };

  return (
    <form onSubmit={formik.handleSubmit}>
      <DialogContent>
        <TextField
          fullWidth
          id="username"
          name="username"
          label="Username"
          margin="normal"
          value={formik.values.username}
          onChange={formik.handleChange}
          error={formik.touched.username && Boolean(formik.errors.username)}
          helperText={formik.touched.username && formik.errors.username}
        />
        <TextField
          fullWidth
          id="password"
          name="password"
          label="Password"
          type="password"
          margin="normal"
          value={formik.values.password}
          onChange={formik.handleChange}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
        />
        <TextField
          fullWidth
          id="name"
          name="name"
          label="Name"
          margin="normal"
          value={formik.values.name}
          onChange={formik.handleChange}
          error={formik.touched.name && Boolean(formik.errors.name)}
          helperText={formik.touched.name && formik.errors.name}
        />
        <TextField
          fullWidth
          id="email"
          name="email"
          label="Email"
          type="email"
          margin="normal"
          value={formik.values.email}
          onChange={formik.handleChange}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && formik.errors.email}
        />
        <TextField
          fullWidth
          select
          id="role"
          name="role"
          label="Role"
          margin="normal"
          value={formik.values.role}
          onChange={handleRoleChange}
          error={formik.touched.role && Boolean(formik.errors.role)}
          helperText={formik.touched.role && formik.errors.role}
        >
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="user">Employee</MenuItem>
        </TextField>

        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Permissions</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
            {PERMISSION_OPTIONS.map(([permission, label]) => (
              <FormControlLabel
                key={permission}
                control={
                  <Checkbox
                    checked={formik.values.permissions[permission] || false}
                    onChange={() => handlePermissionChange(permission)}
                    name={`permissions.${permission}`}
                    disabled={formik.values.role === 'admin' || 
                            (formik.values.role === 'user' && permission === 'canView')}
                  />
                }
                label={label}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" color="primary">
          Add User
        </Button>
      </DialogActions>
    </form>
  );
};

export default UserForm;