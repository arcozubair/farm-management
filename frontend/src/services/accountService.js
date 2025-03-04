import api from './api';

const BASE_URL = '/accounts';

const accountService = {
  // Get accounts with search parameters
  getAccounts: async (params) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.accountType) queryParams.append('accountType', params.accountType);
      if (params.search) queryParams.append('search', params.search);
      
      const response = await api.get(`${BASE_URL}/search?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch accounts' };
    }
  },

  // Create a new account
  createAccount: async (accountData) => {
    try {
      const response = await api.post(BASE_URL, accountData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create account' };
    }
  },

  // Get all accounts
  getAllAccounts: async () => {
    try {
      const response = await api.get(BASE_URL);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch accounts' };
    }
  },

  // Get account by ID
  getAccountById: async (id) => {
    try {
      const response = await api.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error in getAccountById:', error);
      throw error;
    }
  },

  // Update account
  updateAccount: async (id, accountData) => {
    try {
      const response = await api.put(`${BASE_URL}/${id}`, accountData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update account' };
    }
  },

  // Delete account
  deleteAccount: async (id) => {
    try {
      const response = await api.delete(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete account' };
    }
  },

  // Get accounts by type
  getAccountsByType: async (type) => {
    try {
      const response = await api.get(`${BASE_URL}/type/${type}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch accounts by type' };
    }
  },

  createPayment: async (paymentData) => {
    try {
      const response = await api.post(`${BASE_URL}/payment`, paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create payment' };
    }
  },

  // Get account balance
  getAccountBalance: async (id) => {
    try {
      const response = await api.get(`${BASE_URL}/${id}/balance`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch account balance' };
    }
  },

  getAccountLedger: async (accountId, params) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.dateRange) queryParams.append('dateRange', params.dateRange);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      
      const response = await api.get(`${BASE_URL}/${accountId}/ledger?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error in getAccountLedger:', error);
      throw error;
    }
  },

  getSalesLedger: async (params) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.dateRange) queryParams.append('dateRange', params.dateRange);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      
      const response = await api.get(`${BASE_URL}/sales-ledger?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error in getSalesLedger:', error);
      throw error;
    }
  },

  getCustomerLedger: async (customerId, params) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      
      const response = await api.get(`${BASE_URL}/${customerId}/customer-ledger?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error in getCustomerLedger:', error);
      throw error;
    }
  }
};

export default accountService; 