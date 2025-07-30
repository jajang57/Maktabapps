import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // gunakan env Vite
});

console.log('API BASE URL:', import.meta.env.VITE_API_URL); // cek baseURL di console

// Request interceptor untuk menambahkan token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor untuk handle token expired dan single device violation
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const errorData = error.response.data;
      
      // Handle single device violation
      if (errorData.code === 'SINGLE_DEVICE_VIOLATION') {
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Dispatch custom event for single device violation
        window.dispatchEvent(new CustomEvent('singleDeviceViolation', {
          detail: {
            type: 'SINGLE_DEVICE_VIOLATION',
            message: errorData.error
          }
        }));
      } else {
        // Token expired atau invalid biasa
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
