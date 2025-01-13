import axios from 'axios';
const API_URL = 'http://localhost:5000/api/products';


// Get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Get all products
export const getAllProducts = async () => {
  try {
    const response = await axios.get(API_URL, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to fetch products' };
  }
};

// Get product details
export const getProductDetails = async (date) => {
  try {
    const response = await axios.get(`${API_URL}/details`, {
      ...getAuthHeader(),
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
    const response = await axios.post(API_URL, productData, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to add product' };
  }
};

// Update product
export const updateProduct = async (id, productData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, productData, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to update product' };
  }
};

// Delete product
export const deleteProduct = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to delete product' };
  }
};

// Update stock
export const updateStock = async (stockData) => {
  try {
    const response = await axios.post(`${API_URL}/updateStock`, stockData, getAuthHeader());
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'Failed to update stock' };
  }
};

// Export all functions as named exports
export const productService = {
  getAllProducts,
  getProductDetails,
  addProduct,
  updateProduct,
  deleteProduct,
  updateStock
};

// No default export needed since we're using named exports 