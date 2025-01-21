import api from './api';
const API_URL = '/customers';


const customerService = {
  getCustomers: async () => {
    try {
      const response = await api.get(API_URL);
      return response.data;
    } catch (error) {
      console.error('Error in getCustomers:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  getCustomerById: async (id) => {
    try {
      const response = await api.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error in getCustomerById:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  addCustomer: async (customerData) => {
    try {
      const response = await api.post(API_URL, customerData);
      return response.data;
    } catch (error) {
      console.error('Error in addCustomer:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  updateCustomer: async (id, customerData) => {
    try {
      const response = await api.put(`${API_URL}/${id}`, customerData);
      return response.data;
    } catch (error) {
      console.error('Error in updateCustomer:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  getCustomerLedger: async (customerId, startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`${API_URL}/${customerId}/ledger?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error in getCustomerLedger:', {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.config?.headers
      });
      throw error.response?.data || error;
    }
  },

  searchCustomers: async (searchText) => {
    try {
      const response = await api.get(`${API_URL}/search`, {
       
        params: { q: searchText }
      });
      return response.data;
    } catch (error) {
      console.error('Error in searchCustomers:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  getCustomerLedgerSummary: async (customerId, startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`${API_URL}/${customerId}/ledger/summary?${params}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default customerService;