import api from './api';

const BASE_URL = '/company-settings';

export const getCompanySettings = async () => {
  try {
    const response = await api.get(BASE_URL);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch company settings' };
  }
};

export const getNextInvoiceNumber = async () => {
  try {
    const response = await api.get(`${BASE_URL}/next-invoice-number`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch next invoice number' };
  }
};

export const updateCompanySettings = async (data) => {
  try {
    const response = await api.put(BASE_URL, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update company settings' };
  }
}; 