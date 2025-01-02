import axios from 'axios';
import { enqueueSnackbar } from 'notistack';

const API_URL = 'http://localhost:5000/api';

export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      enqueueSnackbar('Successfully logged in!', { variant: 'success' });
    }
    return response.data;
  } catch (error) {
    enqueueSnackbar(error.response?.data?.error || 'Login failed', { 
      variant: 'error' 
    });
    throw error;
  }
};

export const logout = () => {
  try {
    localStorage.removeItem('token');
    enqueueSnackbar('Successfully logged out', { variant: 'success' });
  } catch (error) {
    enqueueSnackbar('Error logging out', { variant: 'error' });
  }
};

export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    enqueueSnackbar('Registration successful!', { variant: 'success' });
    return response.data;
  } catch (error) {
    enqueueSnackbar(error.response?.data?.error || 'Registration failed', { 
      variant: 'error' 
    });
    throw error;
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
    enqueueSnackbar('Password reset instructions sent to your email', { 
      variant: 'success' 
    });
    return response.data;
  } catch (error) {
    enqueueSnackbar(error.response?.data?.error || 'Failed to send reset email', { 
      variant: 'error' 
    });
    throw error;
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await axios.post(`${API_URL}/auth/reset-password`, {
      token,
      newPassword
    });
    enqueueSnackbar('Password successfully reset!', { variant: 'success' });
    return response.data;
  } catch (error) {
    enqueueSnackbar(error.response?.data?.error || 'Failed to reset password', { 
      variant: 'error' 
    });
    throw error;
  }
};

export const changePassword = async (passwords) => {
  try {
    const response = await axios.post(
      `${API_URL}/auth/change-password`,
      passwords,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }
    );
    enqueueSnackbar('Password successfully changed!', { variant: 'success' });
    return response.data;
  } catch (error) {
    enqueueSnackbar(error.response?.data?.error || 'Failed to change password', { 
      variant: 'error' 
    });
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Get current user's token
export const getToken = () => {
  return localStorage.getItem('token');
};

export const authService = {
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  login: async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { username, password });
      console.log('Auth service login response:', response); // Debug log
      return response;
    } catch (error) {
      console.error('Auth service login error:', error); // Debug log
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  setUserData: (token, user) => {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Error setting user data:', error);
    }
  },

  hasRole: (requiredRole) => {
    const user = authService.getCurrentUser();
    return user?.role === requiredRole;
  }
};

export default authService; 