import api from './api';
const API_URL = '/livestock';



// Export individual functions
export const getAllLivestock = async () => {
  try {
    const response = await api.get(API_URL, );
    console.log('Service response:', response); // Debug log
    return response;
  } catch (error) {
    console.error('Service error:', error);
    throw error;
  }
};

export const addLivestock = async (livestockData) => {
  const response = await api.post(API_URL, livestockData, );
  return response.data;
};

export const updateLivestock = async (id, updateData) => {
  const response = await api.put(`${API_URL}/${id}`, updateData, );
  return response.data;
};

export const deleteLivestock = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`, );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getLivestockStats = async () => {
  const response = await api.get(`${API_URL}/stats`, );
  return response.data;
};




// Update livestock prices
export const updateLivestockPrices = async (prices) => {
  try {
    const promises = Object.entries(prices).map(([id, rate]) => 
      api.post(
        `${API_URL}/update-rate`,
        { id, rate }
      )
    );
    
    await Promise.all(promises);
    return { success: true };
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to update livestock prices' };
  }
};


// Default export if needed
const livestockService = {
  getAllLivestock,
  addLivestock,
  updateLivestock,
  deleteLivestock,
  getLivestockStats,
  updateLivestockPrices
};

export default livestockService; 