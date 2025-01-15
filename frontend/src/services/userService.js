import api from './api';
const API_URL = '/users';


// Export these functions explicitly
export const getAll = async () => {
  return await api.get(`${API_URL}`, );
};

export const create = async (userData) => {
  return await api.post(`${API_URL}`, userData, );
};

export const updatePermissions = async (userId, permissions) => {
  console.log('Calling updatePermissions with:', { userId, permissions }); // Debug log
  return await api.patch(
    `${API_URL}/${userId}/permissions`,
    { permissions },
    
  );
};

export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(
      `${API_URL}/users/${userId}`,
      
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updatePassword = async (passwordData) => {
  try {
    const response = await api.put(
      `${API_URL}/password`,
      passwordData,
      
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
