import React from 'react';
import { useState, useEffect, useRef } from 'react';
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
  SpaceDashboard as DashboardIcon,
  AgricultureOutlined as LivestockIcon,
  Inventory as ProductsIcon,
  Diversity3 as PeopleIcon,
  ShoppingBagOutlined as SalesIcon,
  ImportContacts as BookIcon,
  ManageAccounts as UserIcon,
  Menu as MenuIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useResponsive from '../hooks/useResponsive';

const DRAWER_WIDTH = 240;
const CLOSED_DRAWER_WIDTH = 80;

const MainLayout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(true);
  const { isMobile, isTablet } = useResponsive();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isMobile || isTablet) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [isMobile, isTablet]);

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const menuItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: '/icons/dashboard.png',
      iconColor: '#2196f3'
    },
    { 
      path: '/livestock', 
      label: 'Livestock', 
      icon: '/icons/cow.png',
      iconColor: '#4caf50'
    },
    { 
      path: '/products', 
      label: 'Products', 
      icon: '/icons/box.png',
      iconColor: '#ff9800'
    },
    { 
      path: '/customers', 
      label: 'Customers', 
      icon: '/icons/customers.png',
      role: 'admin',
      iconColor: '#e91e63'
    },
    { 
      path: '/sales', 
      label: 'Sales', 
      icon: '/icons/sales.png',
      iconColor: '#9c27b0'
    },
    { 
      path: '/daybook', 
      label: 'Day Book', 
      icon: '/icons/book.png',
      role: 'admin',
      iconColor: '#00bcd4'
    },
    { 
      path: '/users', 
      label: 'Users', 
      icon: '/icons/users.png',
      role: 'admin',
      iconColor: '#f44336'
    },
    { 
      path: '/settings', 
      label: 'Company Settings', 
      icon: '/icons/settings.png',
      role: 'admin',
      iconColor: '#f44336'
    },
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
      <Box sx={{ display: 'flex', backgroundColor: '#f8fafc' }}>
        {/* App Bar */}
        <AppBar
          position="fixed"
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(12px)',
            boxShadow: 'none',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            width: `calc(100% - ${!isMobile ? (open ? DRAWER_WIDTH : CLOSED_DRAWER_WIDTH) : 0}px)`,
            ml: `${!isMobile ? (open ? DRAWER_WIDTH : CLOSED_DRAWER_WIDTH) : 0}px`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <Toolbar sx={{ justifyContent: 'flex-end' }}>
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={handleDrawerToggle}
                sx={{
                  position: 'absolute',
                  left: 16,
                  color: 'text.secondary',
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            {/* Desktop Profile Section with Dropdown */}
            {!isMobile && (
              <>
                <Box
                  onClick={handleMenu}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    py: 1,
                    px: 2,
                    borderRadius: 3,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.03)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: 'primary.main',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  >
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ ml: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {user?.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                    </Typography>
                  </Box>
                </Box>

                {/* Profile Dropdown Menu */}
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  onClick={handleClose}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      minWidth: 200,
                      borderRadius: 2,
                      overflow: 'visible',
                      filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                      '&:before': {
                        content: '""',
                        display: 'block',
                        position: 'absolute',
                        top: 0,
                        right: 14,
                        width: 10,
                        height: 10,
                        bgcolor: 'background.paper',
                        transform: 'translateY(-50%) rotate(45deg)',
                        zIndex: 0,
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem onClick={handleProfile} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                      <PersonIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>Profile</Typography>
                  </MenuItem>
                  <Divider sx={{ my: 0.5 }} />
                  <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'error.main' }}>
                      Logout
                    </Typography>
                  </MenuItem>
                </Menu>
              </>
            )}
          </Toolbar>
        </AppBar>

        {/* Sidebar */}
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={open}
          onClose={isMobile ? handleDrawerToggle : undefined}
          sx={{
            width: open ? DRAWER_WIDTH : CLOSED_DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: open ? DRAWER_WIDTH : CLOSED_DRAWER_WIDTH,
              boxSizing: 'border-box',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              boxShadow: 'none',
              borderRight: '1px solid rgba(0, 0, 0, 0.05)',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          {/* Sidebar Header */}
          <Box sx={{ 
            p: 2.5, 
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            minHeight: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {open && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <img 
                  src="/logo.png" 
                  alt="Farm Logo" 
                  style={{ 
                    height: '36px',
                    marginRight: '16px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }} 
                />
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: '-0.5px' }}>
                  Farm Management
                </Typography>
              </Box>
            )}
            {!isMobile && (
              <IconButton
                onClick={handleDrawerToggle}
                sx={{
                  borderRadius: 2,
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  }
                }}
              >
                {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </IconButton>
            )}
          </Box>

          {/* Navigation Items */}
          <List sx={{ mt: 3, px: 2, flex: 1 }}>
            {menuItems.map((item) => {
              if (item.role && user?.role !== item.role) return null;
              const isActive = location.pathname === item.path;

              return (
                <ListItem key={item.path} disablePadding sx={{ display: 'block', mb: 1 }}>
                  <ListItemButton
                    onClick={() => {
                      navigate(item.path);
                      if (isMobile) {
                        setOpen(false);
                        handleDrawerToggle();
                      }
                    }}
                    sx={{
                      minHeight: 48,
                      minWidth: { xs: '100%', md: 200 },
                      width: '100%',
                      px: 2.5,
                      py: 1.5,
                      borderRadius: 3,
                      backgroundColor: isActive ? 'primary.main' : 'transparent',
                      boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                      '&:hover': {
                        backgroundColor: isActive ? 'primary.dark' : 'rgba(0, 0, 0, 0.03)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      },
                      transition: 'all 0.2s ease-in-out',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: open ? 'flex-start' : 'center',
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 2 : 'auto',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease-in-out',
                        '& img': {
                          width: '28px',
                          height: '28px',
                          transition: 'transform 0.2s ease-in-out',
                        
                        },
                      }}
                    >
                      <img src={item.icon} alt={item.label} />
                    </ListItemIcon>
                    {open && (
                      <ListItemText
                        primary={item.label}
                        sx={{
                          opacity: open ? 1 : 0,
                          flex: 'none',
                          minWidth: 100,
                          '& .MuiTypography-root': {
                            fontWeight: 600,
                            letterSpacing: '-0.3px',
                            color: isActive ? 'common.white' : 'text.primary',
                            transition: 'color 0.2s ease-in-out',
                            whiteSpace: 'nowrap',
                          },
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          {/* Profile Section in Sidebar for Mobile - Moved to bottom */}
          {isMobile && (
            <Box sx={{ 
              p: 2, 
              borderTop: '1px solid rgba(0, 0, 0, 0.05)',
              mt: 'auto'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'primary.main',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box sx={{ ml: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {user?.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <ListItemButton onClick={handleProfile} sx={{ borderRadius: 2, mb: 1 }}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Profile" />
                </ListItemButton>
                <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2 }}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText primary="Logout" sx={{ color: 'error.main' }} />
                </ListItemButton>
              </Box>
            </Box>
          )}
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 4 },
            backgroundColor: '#f8fafc',
            minHeight: '100vh',
            width: `calc(100% - ${!isMobile ? (open ? DRAWER_WIDTH : CLOSED_DRAWER_WIDTH) : 0}px)`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
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