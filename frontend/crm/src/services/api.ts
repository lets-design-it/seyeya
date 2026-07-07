import axios from 'axios';

const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Global Axios client instance ready for backend connection
export const api = axios.create({
  baseURL: isLocal ? 'http://localhost:8000/api/v1' : 'https://api.seyeyalodge.com/v1',
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

export default api;
