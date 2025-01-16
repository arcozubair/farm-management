import api from './api';
const API_URL = 'products';



// Get all products
export const getAllProducts = async () => {
  try {
    const response = await api.get(API_URL, );
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to fetch products' };
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
export const addProduct = async (productData) => {
  try {
    const response = await api.post(API_URL, productData, );
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to add product' };
  }
};

// Update product
export const updateProduct = async (id, productData) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, productData, );
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to update product' };
  }
};

// Delete product
export const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`, );
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to delete product' };
  }
};

// Update stock
export const updateStock = async (stockData) => {
  try {
    const response = await api.post(`${API_URL}/updateStock`, stockData, );
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to update stock' };
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


// Export all functions as named exports
export const productService = {
  getAllProducts,
  getProductDetails,
  addProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  updateProductPrices
};
