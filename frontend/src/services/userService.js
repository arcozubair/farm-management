import axios from 'axios';

// Define API_URL directly (replace with your actual backend URL)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get token
const getToken = () => localStorage.getItem('token');

// Helper function to get headers
const getHeaders = () => ({
  headers: { Authorization: `Bearer ${getToken()}` }
});

// Export these functions explicitly
export const getAll = async () => {
  return await axios.get(`${API_URL}/users`, getHeaders());
};

export const create = async (userData) => {
  return await axios.post(`${API_URL}/users`, userData, getHeaders());
};

export const updatePermissions = async (userId, permissions) => {
  console.log('Calling updatePermissions with:', { userId, permissions }); // Debug log
  return await axios.patch(
    `${API_URL}/users/${userId}/permissions`,
    { permissions },
    getHeaders()
  );
};

export const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/users/${userId}`,
      getHeaders()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updatePassword = async (passwordData) => {
  try {
    const response = await axios.put(
      `${API_URL}/users/password`,
      passwordData,
      getHeaders()
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
