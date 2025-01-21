import api from './api';

const BASE_URL = '/invoices';

// Create new invoice
export const createInvoice = async (invoiceData) => {
  try {
    console.log('Sending invoice data to API:', invoiceData);
    const response = await api.post(BASE_URL, invoiceData);
    console.log('API response:', response);
    return response.data;
  } catch (error) {
    console.error('API error:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
      throw error.response.data;
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      throw { message: 'No response from server. Please try again.' };
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
      throw { message: 'Failed to send request. Please try again.' };
    }
  }
};

// Get all invoices with optional filters
export const getInvoices = async (params) => {
  try {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch invoices' };
  }
};

// Get single invoice by ID
export const getInvoiceById = async (id) => {
  try {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch invoice' };
  }
};

// Update invoice payment
export const updateInvoicePayment = async (id, paymentData) => {
  try {
    const response = await api.put(`${BASE_URL}/${id}/payment`, paymentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update payment' };
  }
};

// Get invoices by customer
export const getInvoicesByCustomer = async (customerId) => {
  try {
    const response = await api.get(`${BASE_URL}/customer/${customerId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch customer invoices' };
  }
};

// Delete invoice (admin only)
export const deleteInvoice = async (id) => {
  try {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete invoice' };
  }
};

// Get invoice statistics
export const getInvoiceStats = async (params) => {
  try {
    const response = await api.get(`${BASE_URL}/stats`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch invoice statistics' };
  }
};

// Generate invoice PDF
export const generateInvoicePDF = async (id) => {
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
export const searchInvoices = async (query) => {
  try {
    const response = await api.get(`${BASE_URL}/search`, { params: { q: query } });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to search invoices' };
  }
}; 