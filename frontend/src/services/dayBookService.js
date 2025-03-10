import api from './api';

const API_URL = '/daybook';


const dayBookService = {
 

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
  getEntries: async (date) => {
    const response = await api.get(`${API_URL}/report`);
    return response.data;
  },

  getDayBookReport: async ({ startDate, endDate }) => {
    const response = await api.get(`${API_URL}/report`, {
      params: { startDate, endDate }
    });
    return response.data;
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