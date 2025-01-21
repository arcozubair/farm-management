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
import { Add as AddIcon, PersonAdd as PersonAddIcon, Security as SecurityIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import PermissionsDialog from '../components/dialogs/PermissionsDialog';
import UserForm from '../components/forms/UserForm';
import * as userService from '../services/userService';
import { DataGrid } from '@mui/x-data-grid';
import useResponsive from '../hooks/useResponsive';

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
  const {isMobile} = useResponsive();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAll();
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
      await userService.deleteUser(userToDelete._id);
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
    { 
      field: 'username', 
      headerName: 'Username', 
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
          {params.value}
        </div>
      )
    },
    { 
      field: 'name', 
      headerName: 'Name', 
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
          {params.value}
        </div>
      )
    },
    { 
      field: 'email', 
      headerName: 'Email', 
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
          {params.value}
        </div>
      )
    },
    { 
      field: 'role', 
      headerName: 'Role', 
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
          {params.value}
        </div>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 120,
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
      const response = await userService.create(values);
      if (response.data.success) {
        setUsers((prevUsers) => [...prevUsers, response.data.data]);
        setIsDialogOpen(false);
        enqueueSnackbar('User created successfully', { variant: 'success' });
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to create user', { 
        variant: 'error' 
      });
      throw error;
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
      const response = await userService.updatePermissions(selectedUser._id, userPermissions);
      
      if (response.data.success) {
        setUsers(users.map(user => 
          user._id === selectedUser._id 
            ? { ...user, permissions: userPermissions }
            : user
        ));
      enqueueSnackbar('User permissions updated successfully', { variant: 'success' });

        handlePermissionsDialogClose();
      }
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to update user permissions', { 
        variant: 'error' 
      });
      setError('Failed to update permissions');
    }
  };

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 },
      width: '100%',
      maxWidth: '100%',
      overflowX: 'hidden' 
    }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', 
        gap: 2,
        mb: 3 
      }}>
        <Typography  variant={isMobile ? "h5" : "h4"}
                sx={{ fontWeight: 600, color: 'primary.main' }}>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={!isMobile && <PersonAddIcon />}
          onClick={() => setIsDialogOpen(true)}
          sx={{ 
            width: { xs: '40px', sm: 'auto' },
            minWidth: { xs: '40px', sm: '100px' },
            height: { xs: '40px', },
            borderRadius: isMobile ? '50%' : '8px',
            p: isMobile ? 0 : 2
          }}
        >
          {isMobile ? <PersonAddIcon /> : 'Add User'}
        </Button>
      </Box>

      <Box sx={{ 
        width: '100%',
        overflowX: 'auto'
      }}>
        <DataGrid 
          rows={users} 
          columns={columns} 
          loading={loading}   
          getRowId={(row) => row._id}
          autoHeight
          pagination
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          sx={{
            backgroundColor: 'white',
            borderRadius: '12px',
            '& .MuiDataGrid-main': {
              overflow: 'auto'
            },
            '& .MuiDataGrid-cell': {
              borderBottom: 'none',
              padding: '16px',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f8f9fa',
              borderBottom: 'none',
              padding: '16px',
            },
            '& .MuiDataGrid-row': {
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            },
            '& .MuiDataGrid-virtualScroller': {
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                height: '8px',
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#888',
                borderRadius: '4px',
              },
            },
            border: 'none',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }} 
        />
      </Box>

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
