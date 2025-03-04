import api from './api';

// Get stock movements for a product
export const getProductMovements = async (productId) => {
  try {
console.log("zzzzzzzzzzzzzzz",api);

    const response = await api.get(`/products/${productId}/movements`);
    return response.data;
  } catch (error) {
    throw {
      message: error.response?.data?.message || error.message || 'Failed to fetch product movements',
      status: error.response?.status,
      data: error.response?.data
    };
  }
};

// Get stock movements for livestock
export const getLivestockMovements = async (livestockId) => {
  try {
console.log("zzzzzzzzzzzzzzz",api);

    const response = await api.get(`//livestock/${livestockId}/movements`);
    return response.data;
  } catch (error) {
    throw {
      message: error.response?.data?.message || error.message || 'Failed to fetch livestock movements',
      status: error.response?.status,
      data: error.response?.data
    };
  }
};

// Update product stock
export const updateProductStock = async (productId, stockData) => {
  try {
    const response = await api.post(`/products/${productId}/stock`, stockData);
    return response.data;
  } catch (error) {
    throw {
      message: error.response?.data?.message || error.message || 'Failed to update product stock',
      status: error.response?.status,
      data: error.response?.data
    };
  }
};

// Update livestock stock
export const updateLivestockStock = async (livestockId, stockData) => {
  try {
    const response = await api.post(`/livestock/${livestockId}/stock`, stockData);
    return response.data;
  } catch (error) {
    throw {
      message: error.response?.data?.message || error.message || 'Failed to update livestock stock',
      status: error.response?.status,
      data: error.response?.data
    };
  }
};

// Get all movements by date
export const getMovementsByDate = async (date) => {
  try {
    // Format date to YYYY-MM-DD
    const formattedDate = date instanceof Date 
      ? date.toISOString().split('T')[0] 
      : new Date(date).toISOString().split('T')[0];

    if (formattedDate === 'Invalid Date') {
      throw new Error('Invalid date format');
    }

    const response = await api.get(`/stock-movements/by-date/${formattedDate}`);
    return response.data;
  } catch (error) {
    console.error('Error in getMovementsByDate:', error);
    throw error.response?.data || error;
  }
};

// Search movements
export const searchMovements = async (query) => {
  try {
    const response = await api.get(`/stock-movements/search`, { params: { q: query } });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to search movements' };
  }
};

export default {
  getProductMovements,
  getLivestockMovements,
  updateProductStock,
  updateLivestockStock,
  getMovementsByDate,
  searchMovements
}; 