import axios from 'axios';

// Cleanly resolve API base URL: In production, automatically connects to your live Render backend
const fallbackUrl = import.meta.env.PROD
  ? 'https://civicconnect-api-e36u.onrender.com/api'
  : 'http://localhost:5000/api';

const rawBaseUrl = import.meta.env.VITE_API_URL || fallbackUrl;
const cleanUrl = rawBaseUrl.trim().replace(/\/+$/, '');
const baseURL = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

const api = axios.create({
  baseURL,
});

// Intercept requests to add the Authorization token
api.interceptors.request.use(
  (config) => {
    // Get the token from local storage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
