import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL || '/api';
const apiBaseUrl = configuredApiUrl.replace(/\/+$/, '').endsWith('/api')
  ? configuredApiUrl.replace(/\/+$/, '')
  : `${configuredApiUrl.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('maskank_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
