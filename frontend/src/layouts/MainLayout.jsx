import React from 'react';
import { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Pets as LivestockIcon,
  Inventory as ProductsIcon,
  PointOfSale as SalesIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Book as BookIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 240;

const MainLayout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { path: '/livestock', label: 'Livestock', icon: LivestockIcon },
    { path: '/products', label: 'Products', icon: ProductsIcon },
    { path: '/customers', label: 'Customers', icon: PeopleIcon, role: 'admin' },
    { path: '/sales', label: 'Sales', icon: SalesIcon },
    { path: '/daybook', label: 'Day Book', icon: BookIcon, role: 'admin' },
    { path: '/users', label: 'Users', icon: PeopleIcon, role: 'admin' },

  ];

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const handleLogout = () => {
    logout();
  };

  return (
    isAuthenticated ? (
      <Box sx={{ display: 'flex' }}>
        {/* App Bar */}
        <AppBar
          position="fixed"
          sx={{
            backgroundColor: 'background.paper',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            width: `calc(100% - ${open ? DRAWER_WIDTH : 64}px)`,
            ml: `${open ? DRAWER_WIDTH : 64}px`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          <Toolbar sx={{ justifyContent: 'flex-end' }}>
            {/* Profile Section */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                onClick={handleMenu}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  py: 1,
                  px: 2,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: 'primary.main',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box sx={{ ml: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {user?.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                  </Typography>
                </Box>
              </Box>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                sx={{
                  '& .MuiPaper-root': {
                    width: 220,
                    mt: 1.5,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {user?.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {user?.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={handleProfile} sx={{ py: 1.5 }}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <Typography variant="body2">Profile</Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <Typography variant="body2" color="error">
                    Logout
                  </Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            width: open ? DRAWER_WIDTH : 64,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: open ? DRAWER_WIDTH : 64,
              boxSizing: 'border-box',
              backgroundColor: 'background.paper',
              boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
            },
          }}
        >
          {/* Sidebar Header */}
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: open ? 'space-between' : 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            {open && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <img 
                  src="/logo.png" 
                  alt="Farm Logo" 
                  style={{ 
                    height: '32px',
                    marginRight: '12px',
                    borderRadius: '4px'
                  }} 
                />
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  Farm Management
                </Typography>
              </Box>
            )}
            <IconButton onClick={handleDrawerToggle}>
              {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          </Box>

          {/* Navigation Items */}
          <List sx={{ mt: 1 }}>
            {menuItems.map((item) => {
              if (item.role && user?.role !== item.role) return null;
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <ListItem key={item.path} disablePadding sx={{ display: 'block' }}>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    sx={{
                      minHeight: 48,
                      px: 2.5,
                      py: 1.5,
                      mx: 1,
                      borderRadius: 1,
                      backgroundColor: isActive ? 'action.selected' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 2 : 'auto',
                        justifyContent: 'center',
                        color: isActive ? 'primary.main' : 'text.secondary',
                      }}
                    >
                      <Icon />
                    </ListItemIcon>
                    {open && (
                      <ListItemText
                        primary={item.label}
                        sx={{
                          opacity: open ? 1 : 0,
                          '& .MuiTypography-root': {
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? 'primary.main' : 'text.primary',
                          },
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            backgroundColor: '#f5f5f5',
            minHeight: '100vh',
            width: `calc(100% - ${open ? DRAWER_WIDTH : 64}px)`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          <Toolbar />
          {children}
        </Box>
      </Box>
    ) : null
  );
};

export default MainLayout; 