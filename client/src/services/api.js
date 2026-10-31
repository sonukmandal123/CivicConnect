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
  timeout: 30000, // 30s timeout to allow Render free tier spin-up
});

// Intercept requests to safely attach the Authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Only attach token if it is a non-empty valid string and not "null"/"undefined"
    if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token.trim()}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept responses for session expiry (401) and cold-start retries
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 1. Handle expired or invalid token (401)
    if (error.response && error.response.status === 401) {
      const isAuthRoute = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/register');
      if (!isAuthRoute) {
        // Clear invalid / expired session data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Notify components (e.g. AuthContext, Dashboard)
        window.dispatchEvent(
          new CustomEvent('auth:session_expired', {
            detail: { message: error.response?.data?.message || 'Session expired. Please log in again.' }
          })
        );
      }
      return Promise.reject(error);
    }

    // 2. Retry idempotent GET requests once if server is cold-starting (502, 503, 504, or network disconnect)
    if (
      originalRequest &&
      originalRequest.method?.toLowerCase() === 'get' &&
      !originalRequest._retry &&
      (error.code === 'ERR_NETWORK' || [502, 503, 504].includes(error.response?.status))
    ) {
      originalRequest._retry = true;
      // Wait 2.5s before retrying to allow container spin-up
      await new Promise((resolve) => setTimeout(resolve, 2500));
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default api;
