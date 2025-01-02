import axios from 'axios';

const API_URL = 'http://localhost:5000/api/livestock';

// Get token from localStorage
const getAuthHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});

// Export individual functions
export const getAllLivestock = async () => {
  try {
    const response = await axios.get(API_URL, getAuthHeader());
    console.log('Service response:', response); // Debug log
    return response;
  } catch (error) {
    console.error('Service error:', error);
    throw error;
  }
};

export const addLivestock = async (livestockData) => {
  const response = await axios.post(API_URL, livestockData, getAuthHeader());
  return response.data;
};

export const updateLivestock = async (id, updateData) => {
  const response = await axios.put(`${API_URL}/${id}`, updateData, getAuthHeader());
  return response.data;
};

export const deleteLivestock = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getAuthHeader());
  return response.data;
};

export const getLivestockStats = async () => {
  const response = await axios.get(`${API_URL}/stats`, getAuthHeader());
  return response.data;
};

// Default export if needed
const livestockService = {
  getAllLivestock,
  addLivestock,
  updateLivestock,
  deleteLivestock,
  getLivestockStats
};

export default livestockService; 