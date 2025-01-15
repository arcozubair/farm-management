import api from './api';

const API_URL = '/daybook';


const dayBookService = {
  getEntries: async (date) => {
    try {
      const response = await api.get(`${API_URL}`, {
        params: { date }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  addCollection: async (collectionData) => {
    try {
      const response = await api.post(
        `${API_URL}/collection`, 
        collectionData, 
       
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to add collection');
      }
      
      console.log('Collection added:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding collection:', error);
      throw error.response?.data || error;
    }
  },

  addTransaction: async (transactionData) => {
    try {
      const response = await api.post(
        `${API_URL}/transaction`, 
        transactionData, 
       
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default dayBookService;