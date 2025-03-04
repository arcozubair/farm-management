import api from './api';

const API_URL = '/products';

// Get all products
export const getAllProducts = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get product details
export const getProductDetails = async (date) => {
  try {
    const response = await api.get(`${API_URL}/details`, {
      
      params: { date }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to fetch product details' };
  }
};

// Add product
export const createProduct = async (productData) => {
  try {
    const response = await api.post(API_URL, productData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to create product' };
  }
};

// Update product
export const updateProduct = async (id, productData) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, productData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to update product' };
  }
};

// Delete product
export const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to delete product' };
  }
};

// Update stock
export const updateStock = async (data) => {
  try {
    const response = await api.post(`${API_URL}/update-stock`, {
      ...data,
      transactionType: data.transactionType || ''  // Allow passing transactionType from frontend
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};


// Update product prices
export const updateProductPrices = async (prices) => {
  try {
    const promises = Object.entries(prices).map(([id, price]) => 
      api.post(
        `/products/update-price`,
        { id, price }
      )
    );
    
    await Promise.all(promises);
    return { success: true };
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to update product prices' };
  }
};

// Get daily stock report
export const getDailyStockReport = async (date) => {
  try {
    const response = await api.get(`${API_URL}/daily-report`, {
      params: { date }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Export all functions as named exports
export const productService = {
  getAllProducts,
  getProductDetails,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  updateProductPrices,
  getDailyStockReport
};
