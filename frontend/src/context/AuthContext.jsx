import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { useSnackbar } from 'notistack';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const initAuth = () => {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);

      // Redirect to login if no user and not already on login page
      if (!currentUser && location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    };

    initAuth();
  }, [navigate, location.pathname]);

  const login = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      const { token, user } = response.data;
      
      authService.setUserData(token, user);
      setUser(user);
      
      // Navigate to the intended page or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
      
      return user;
    } catch (error) {
      throw error.response?.data?.error || 'Login failed';
    }
  };

  const logout = () => {
    // Clear all auth-related data
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Clear any other app-specific data
    localStorage.clear(); // This will clear ALL localStorage items
    
    // Clear session storage if you're using it
    sessionStorage.clear();

    // Show success message
    enqueueSnackbar('Logged out successfully', { variant: 'success' });
    
    // Navigate to login page
    navigate('/login');
  };



  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  if (loading) {
    // You might want to show a loading spinner here
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 