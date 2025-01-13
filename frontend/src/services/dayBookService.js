import axios from 'axios';

const API_URL = 'http://localhost:5000/api/daybook';

const getAuthHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});

const dayBookService = {
  getEntries: async (date) => {
    try {
      const response = await axios.get(`${API_URL}`, {
        ...getAuthHeader(),
        params: { date }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  addCollection: async (collectionData) => {
    try {
      const response = await axios.post(
        `${API_URL}/collection`, 
        collectionData, 
        getAuthHeader()
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
      const response = await axios.post(
        `${API_URL}/transaction`, 
        transactionData, 
        getAuthHeader()
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default dayBookService;