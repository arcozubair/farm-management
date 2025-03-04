import api from './api';

const BASE_URL = '/purchases';

const purchaseService = {
  createPurchase: async (purchaseData) => {
    try {
      const response = await api.post(BASE_URL, purchaseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create purchase' };
    }
  },

  getPurchases: async (date) => {
    try {
      const formattedDate = date instanceof Date ? date.toISOString().split('T')[0] : 'today';
      const response = await api.get(`${BASE_URL}/date/${formattedDate}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch purchases' };
    }
  },

  getPurchaseById: async (id) => {
    try {
      const response = await api.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch purchase' };
    }
  },

  generatePurchaseNumber: async () => {
    try {
      const response = await api.get(`${BASE_URL}/generate-number`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to generate purchase number' };
    }
  }
};

export default purchaseService; 