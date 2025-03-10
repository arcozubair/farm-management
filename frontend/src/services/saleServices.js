import api from './api';

const BASE_URL = '/sales';

// Create new invoice
export const createSale = async (saleData) => {
  try {
    const response = await api.post(`${BASE_URL}`, saleData);
    return response.data;
  } catch (error) {
    // Simple error handling
    throw {
      message: error.response?.data?.message || error.message || 'Failed to create invoice',
      status: error.response?.status,
      data: error.response?.data
    };
  }
};

// Get all invoices with optional filters
export const getSales = async (date) => {
  try {
    // Format date to YYYY-MM-DD
    const formattedDate = date instanceof Date 
      ? date.toISOString().split('T')[0] 
      : new Date(date).toISOString().split('T')[0];

    // Handle invalid dates
    if (formattedDate === 'Invalid Date') {
      throw new Error('Invalid date format');
    }

    const response = await api.get(`${BASE_URL}/by-date/${formattedDate}`);
    return response.data;
  } catch (error) {
    console.error('Error in getSales:', error);
    throw error.response?.data || error;
  }
};

// Get single invoice by ID
export const getsale = async (id) => {
  try {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw {
      message: error.response?.data?.message || error.message || 'Failed to fetch invoice',
      status: error.response?.status,
      data: error.response?.data
    };
  }
};

// Update invoice payment
export const updateSalePayment = async (id, paymentData) => {
  try {
    const response = await api.put(`${BASE_URL}/${id}/payment`, paymentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update payment' };
  }
};

// Get invoices by customer
export const getsalesByCustomer = async (customerId) => {
  try {
    const response = await api.get(`${BASE_URL}/customer/${customerId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch customer invoices' };
  }
};

// Delete invoice (admin only)
export const deleteSale = async (id) => {
  try {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete invoice' };
  }
};

// Get invoice statistics
export const getSaleStats = async (params) => {
  try {
    const response = await api.get(`${BASE_URL}/stats`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch invoice statistics' };
  }
};

// Generate invoice PDF
export const generateSalePDF = async (id) => {
  try {
    const response = await api.get(`${BASE_URL}/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to generate PDF' };
  }
};

// Search invoices
export const searchSales = async (query) => {
  try {
    const response = await api.get(`${BASE_URL}/search`, { params: { q: query } });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to search invoices' };
  }
};

export const getSalesByDate = async (date) => {
  try {
    // Format date to YYYY-MM-DD
    const formattedDate = date instanceof Date 
      ? date.toISOString().split('T')[0] 
      : new Date(date).toISOString().split('T')[0];

    // Handle invalid dates
    if (formattedDate === 'Invalid Date') {
      throw new Error('Invalid date format');
    }

    const response = await api.get(`${BASE_URL}/by-date/${formattedDate}`);
    return response.data;
  } catch (error) {
    console.error('Error in getSalesByDate:', error);
    throw error.response?.data || error;
  }
};

export const createMultipleSales = async (salesData) => {
  try {
    const response = await api.post(`${BASE_URL}/create-multiple`, salesData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create group invoices' };
  }
};


export const updateSale = async (id, saleData) => {
  try {
    const response = await api.post(`${BASE_URL}/${id}`, saleData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update sale' };
  }
};
