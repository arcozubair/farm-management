import axios from 'axios';

const API_URL = 'http://localhost:5000/api/products';

// Get token from localStorage
const getAuthHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});

// Get all products
export const getAll = async () => {
  const response = await axios.get(API_URL, getAuthHeader());
  return response.data;
};

// Add new product
export const addProduct = async (productData) => {
  const response = await axios.post(API_URL, productData, getAuthHeader());
  return response.data;
};

// Update product
export const updateProduct = async (id, updateData) => {
  const response = await axios.put(`${API_URL}/${id}`, updateData, getAuthHeader());
  return response.data;
};

// Delete product
export const deleteProduct = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getAuthHeader());
  return response.data;
};

// Get product stats
export const getProductStats = async () => {
  const response = await axios.get(`${API_URL}/stats`, getAuthHeader());
  return response.data;
};

// Default export
const productService = {
  getAll,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductStats
};

export default productService; 