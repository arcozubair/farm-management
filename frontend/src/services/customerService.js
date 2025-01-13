import axios from 'axios';

const BASE_URL = '/api/customers';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found');
  }
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0];
};

const customerService = {
  getCustomers: async () => {
    try {
      const response = await axios.get(BASE_URL, getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error in getCustomers:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  getCustomerById: async (id) => {
    try {
      const response = await axios.get(`${BASE_URL}/${id}`, getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error in getCustomerById:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  addCustomer: async (customerData) => {
    try {
      const response = await axios.post(BASE_URL, customerData, getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error in addCustomer:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  updateCustomer: async (id, customerData) => {
    try {
      const response = await axios.put(`${BASE_URL}/${id}`, customerData, getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error in updateCustomer:', error.response?.data || error);
      throw error.response?.data || error;
    }
  },

  getCustomerLedger: async (customerId, dateRange = null) => {
    try {
      if (!customerId) {
        throw new Error('Customer ID is required');
      }

      let url = `${BASE_URL}/${customerId}/ledger`;
      
      if (dateRange?.startDate && dateRange?.endDate) {
       
        url += `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      }
      
      const response = await axios.get(url, getAuthHeader());
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
      const response = await axios.get(`${BASE_URL}/search`, {
        ...getAuthHeader(),
        params: { q: searchText }
      });
      return response.data;
    } catch (error) {
      console.error('Error in searchCustomers:', error.response?.data || error);
      throw error.response?.data || error;
    }
  }
};

export default customerService;