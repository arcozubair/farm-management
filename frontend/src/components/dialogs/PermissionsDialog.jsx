import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormControlLabel,
  Checkbox,
  Typography
} from '@mui/material';

const PERMISSION_OPTIONS = [
  ['canView', 'View'],
  ['canCreate', 'Create'],
  ['canEdit', 'Edit'],
  ['canDelete', 'Delete'],
  ['canAssignPermissions', 'Assign Permissions'],
  ['canRevokePermissions', 'Revoke Permissions']
];

const PermissionsDialog = ({ 
  open, 
  onClose, 
  onSave, 
  selectedUser, 
  permissions, 
  setPermissions 
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Manage Permissions for {selectedUser?.username}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Select permissions for this user:
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
            {PERMISSION_OPTIONS.map(([permission, label]) => (
              <FormControlLabel
                key={permission}
                control={
                  <Checkbox
                    checked={permissions[permission] || false}
                    onChange={(e) => setPermissions(prev => ({
                      ...prev,
                      [permission]: e.target.checked
                    }))}
                    name={permission}
                  />
                }
                label={label}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={onSave}
          variant="contained" 
          color="primary"
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PermissionsDialog; 