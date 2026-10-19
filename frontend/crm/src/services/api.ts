import axios from 'axios';

export const BACKEND_URL = 'http://139.59.134.181';
export const API_BASE_URL = `${BACKEND_URL}/api/v1`;

// Global Axios client instance pointing to cloud backend on DigitalOcean
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock interceptor adding security tokens to outgoing requests
api.interceptors.request.use((config: any) => {
  const savedUser = localStorage.getItem('seyeya_crm_user');
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      config.headers.Authorization = `Bearer ${parsed.token || 'mock-jwt-token'}`;
    } catch (e) {
      // ignore
    }
  }
  return config;
});

// Interceptor to handle expired tokens and auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('seyeya_crm_user');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('seyeya_auth_required'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
