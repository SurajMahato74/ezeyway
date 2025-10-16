// API Configuration
const isMobile = () => {
  return window.location.protocol === 'capacitor:' || 
         window.location.protocol === 'ionic:' ||
         window.navigator.userAgent.includes('Capacitor');
};

// Use localhost for debugging CORS issues
const getBaseUrl = () => {
  return 'http://localhost:8000/api';
  //return 'https://ezeyway.com/api';
};

// Alternative URLs to try if main ngrok fails
export const FALLBACK_URLS = [
  'http://localhost:8000',
  //'https://ezeyway.com',
  'http://10.0.2.2:8000', // Android emulator
  'http://192.168.1.100:8000' // Local network IP (update with your actual IP)
];

const getWsBaseUrl = () => {
  return 'ws://localhost:8000';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  WS_BASE_URL: getWsBaseUrl()
};

// Debug logging
console.log('API Config Debug:', {
  isMobile: isMobile(),
  protocol: window.location.protocol,
  userAgent: window.navigator.userAgent,
  baseUrl: API_CONFIG.BASE_URL,
  wsUrl: API_CONFIG.WS_BASE_URL
});

// Helper functions
export const getApiUrl = (endpoint: string = '') => {
  return `${API_CONFIG.BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

export const getWsUrl = (endpoint: string = '') => {
  return `${API_CONFIG.WS_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

// Standardize API endpoints
export const normalizeEndpoint = (endpoint: string): string => {
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
};

// Legacy support - can be removed after migration
export const API_BASE = `${API_CONFIG.BASE_URL}/`;
export const API_BASE_URL = API_CONFIG.BASE_URL;  