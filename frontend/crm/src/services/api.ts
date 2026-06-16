import axios from 'axios';

// Global Axios client instance ready for backend connection
export const api = axios.create({
  baseURL: 'https://api.seyeyalodge.com/v1',
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
