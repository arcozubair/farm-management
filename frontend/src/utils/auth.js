// Get token from localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Set token in localStorage
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Remove token from localStorage
export const removeToken = () => {
  localStorage.removeItem('token');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// Get user data from token
export const getUserData = () => {
  const token = getToken();
  if (token) {
    try {
      // Get the payload part of the JWT token
      const payload = token.split('.')[1];
      // Decode the base64 string
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
  return null;
};

export default {
  getToken,
  setToken,
  removeToken,
  isAuthenticated,
  getUserData
}; 