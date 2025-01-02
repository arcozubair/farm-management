import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  IconButton,
  Dialog as ConfirmDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import { Add as AddIcon, Security as SecurityIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import DataTable from '../components/DataTable';
import UserForm from '../components/Forms/UserForm';
import PermissionsDialog from '../components/dialogs/PermissionsDialog';
import { getAll, create, updatePermissions, deleteUser } from '../services/userService';

const Users = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userPermissions, setUserPermissions] = useState({
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canAssignPermissions: false,
    canRevokePermissions: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getAll();
      const filterdUsers = response.data.data.filter((i)=>{
return i.role === 'user'
      })
     setUsers(filterdUsers);
    } catch (error) {
      enqueueSnackbar('Failed to fetch users', { variant: 'error' });
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(userToDelete._id);
      setUsers(users.filter(user => user._id !== userToDelete._id));
      enqueueSnackbar('User deleted successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to delete user', { variant: 'error' });
      console.error('Error deleting user:', error);
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const columns = [
    { field: 'username', headerName: 'Username', flex: 1 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'role', headerName: 'Role', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params) => (
        <Box>
          <IconButton
            onClick={() => {
              setSelectedUser(params.row);
              setUserPermissions(params.row.permissions || {});
              setPermissionsDialogOpen(true);
            }}
          >
            <SecurityIcon />
          </IconButton>
          
          {params.row.role === 'user' && (
            <IconButton
              onClick={() => handleDeleteClick(params.row)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      ),
    },
  ];

  const handleSubmit = async (values) => {
    try {
      const response = await create(values);
      setUsers((prevUsers) => [...prevUsers, response.data.data]);
      setIsDialogOpen(false);
    } catch (error) {
      setError('Failed to add user. Please try again.');
      console.error('Error adding user:', error);
    }
  };

  const handlePermissionsDialogOpen = (user) => {
    setSelectedUser(user);
    setUserPermissions(user.permissions || {});
    setPermissionsDialogOpen(true);
  };

  const handlePermissionsDialogClose = () => {
    setSelectedUser(null);
    setPermissionsDialogOpen(false);
  };

  const handlePermissionsUpdate = async () => {
    try {
      console.log('Updating permissions for:', selectedUser._id); // Debug log
      const response = await updatePermissions(selectedUser._id, userPermissions);
      
      if (response.data.success) {
        setUsers(users.map(user => 
          user._id === selectedUser._id 
            ? { ...user, permissions: userPermissions }
            : user
        ));
        handlePermissionsDialogClose();
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      setError('Failed to update permissions');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsDialogOpen(true)}
        >
          Add User
        </Button>
      </Box>

      <DataTable rows={users} columns={columns} loading={loading} />

      {/* Add User Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <UserForm 
          onSubmit={handleSubmit}
          onClose={() => setIsDialogOpen(false)}
        />
      </Dialog>

      {/* Permissions Management Dialog */}
      <PermissionsDialog
        open={permissionsDialogOpen}
        onClose={() => setPermissionsDialogOpen(false)}
        onSave={handlePermissionsUpdate}
        selectedUser={selectedUser}
        permissions={userPermissions}
        setPermissions={setUserPermissions}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setUserToDelete(null);
        }}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user "{userToDelete?.username}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false);
              setUserToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </ConfirmDialog>
    </Box>
  );
};

export default Users;
