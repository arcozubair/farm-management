import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Grid,
  Divider,
  Avatar,
  IconButton,
  InputAdornment,
  Paper,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import * as userService from '../services/userService';
import { useSnackbar } from 'notistack';

const Profile = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const permissionLabels = {
    canView: 'View',
    canCreate: 'Create',
    canEdit: 'Edit',
    canDelete: 'Delete',
    canAssignPermissions: 'Assign Permissions',
    canRevokePermissions: 'Revoke Permissions'
  };

  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required('Current password is required'),
      newPassword: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('New password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
        .required('Confirm password is required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);
        await userService.updatePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
        enqueueSnackbar('Password updated successfully', { variant: 'success' });
        setOpenPasswordDialog(false);
        resetForm();
      } catch (error) {
        if (error.response?.status === 401) {
          enqueueSnackbar('Current password is incorrect', { variant: 'error' });
        } else {
          enqueueSnackbar(error.response?.data?.message || 'Failed to update password', {
            variant: 'error',
          });
        }
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
        My Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Information Card */}
        <Grid item xs={12} md={12} lg={8}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 2,
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem',
                    fontWeight: 600,
                    mr: 3,
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                    {user?.name}
                  </Typography>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: 'text.secondary',
                      textTransform: 'capitalize',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <BadgeIcon fontSize="small" />
                    {user?.role}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Username
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1,
                        color: 'text.primary',
                        fontWeight: 500,
                      }}
                    >
                      <PersonIcon fontSize="small" color="action" />
                      {user?.username}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Email Address
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1,
                        color: 'text.primary',
                        fontWeight: 500,
                      }}
                    >
                      <EmailIcon fontSize="small" color="action" />
                      {user?.email}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

           
              <Button
                variant="contained"
                startIcon={<LockIcon />}
                onClick={() => setOpenPasswordDialog(true)}
                sx={{ 
                  mt: 3,
                  textTransform: 'none',
                  borderRadius: 2,
                  py: 1.5,
                }}
              >
                Change Password
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Additional Info or Stats Card */}
        <Grid item xs={12} lg={4}>
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 2,
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Account Information
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Account Created
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {new Date(user?.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
              {/* Add more account information as needed */}
            </CardContent>
          </Card>
         
          <Card
            elevation={0}
            sx={{ 
              borderRadius: 2,
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              p: 3
            }}
          >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              User Permissions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: 1
              }}
            >
              {Object.entries(user?.permissions || {})
                .filter(([_, value]) => value === true)
                .map(([key]) => (
                  <Chip
                    key={key}
                    label={permissionLabels[key]}
                    icon={<CheckCircleIcon />}
                    color="success"
                    variant="outlined"
                  />
                ))}
            </Paper>
          </Card>
       
        </Grid>
         {/* Permissions Card */}
       
      </Grid>

      {/* Change Password Dialog */}
      <Dialog
        open={openPasswordDialog}
        onClose={() => {
          setOpenPasswordDialog(false);
          passwordFormik.resetForm();
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }
        }}
      >
        <DialogTitle sx={{ pb: 0, pt: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Change Password
          </Typography>
        </DialogTitle>
        <form onSubmit={passwordFormik.handleSubmit}>
          <DialogContent sx={{ pb: 2, pt: 3 }}>
            <TextField
              fullWidth
              margin="normal"
              name="currentPassword"
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={passwordFormik.values.currentPassword}
              onChange={passwordFormik.handleChange}
              error={
                passwordFormik.touched.currentPassword &&
                Boolean(passwordFormik.errors.currentPassword)
              }
              helperText={
                passwordFormik.touched.currentPassword &&
                passwordFormik.errors.currentPassword
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                    >
                      {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              margin="normal"
              name="newPassword"
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              value={passwordFormik.values.newPassword}
              onChange={passwordFormik.handleChange}
              error={
                passwordFormik.touched.newPassword &&
                Boolean(passwordFormik.errors.newPassword)
              }
              helperText={
                passwordFormik.touched.newPassword &&
                passwordFormik.errors.newPassword
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              margin="normal"
              name="confirmPassword"
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordFormik.values.confirmPassword}
              onChange={passwordFormik.handleChange}
              error={
                passwordFormik.touched.confirmPassword &&
                Boolean(passwordFormik.errors.confirmPassword)
              }
              helperText={
                passwordFormik.touched.confirmPassword &&
                passwordFormik.errors.confirmPassword
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={() => {
                setOpenPasswordDialog(false);
                passwordFormik.resetForm();
              }}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Update Password'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Profile;