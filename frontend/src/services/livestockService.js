import api from './api';

export const livestockService = {
  getAll: async () => {
    try {
      const response = await api.get('/livestock');
      console.log('Livestock service getAll response:', response); // Debug log
      return response;
    } catch (error) {
      console.error('Livestock service getAll error:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/livestock/${id}`);
      return response;
    } catch (error) {
      console.error('Livestock service getById error:', error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const response = await api.post('/livestock', data);
      console.log('Livestock service create response:', response); // Debug log
      return response;
    } catch (error) {
      console.error('Livestock service create error:', error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/livestock/${id}`, data);
      return response;
    } catch (error) {
      console.error('Livestock service update error:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/livestock/${id}`);
      return response;
    } catch (error) {
      console.error('Livestock service delete error:', error);
      throw error;
    }
  },

  getStats: async () => {
    try {
      const response = await api.get('/livestock/stats');
      console.log('Livestock service getStats response:', response); // Debug log
      return response;
    } catch (error) {
      console.error('Livestock service getStats error:', error);
      throw error;
    }
  }
}; 