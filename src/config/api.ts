// API Configuration
const isMobile = () => {
  return window.location.protocol === 'capacitor:' || 
         window.location.protocol === 'ionic:' ||
         window.navigator.userAgent.includes('Capacitor');
};

// API URL Configuration - Comment out the one you DON'T want to use

// For localhost development (uncomment this line):
//const API_BASE_URL = 'http://localhost:8000/api';

// For server/production (uncomment this line):
const API_BASE_URL = 'https://ezeyway.com/api';


const getBaseUrl = () => {
  return API_BASE_URL;
};

// Alternative URLs to try if main URL fails
export const FALLBACK_URLS = [
  // Local development
  'http://localhost:8000/api',
  'http://127.0.0.1:8000/api',
  // Mobile development
  'http://10.0.2.2:8000/api', // Android emulator
  'http://192.168.1.100:8000/api', // Local network IP
  // Production fallback
  'https://ezeyway.com/api'
];

const getWsBaseUrl = () => {
  // Check if we're in development/localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'ws://localhost:8000';
  }

  // For production domain
  return 'wss://ezeyway.com';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  WS_BASE_URL: getWsBaseUrl()
};

// Debug logging (only in development)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('API Config Debug:', {
    isMobile: isMobile(),
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    userAgent: window.navigator.userAgent.substring(0, 50) + '...',
    baseUrl: API_CONFIG.BASE_URL,
    wsUrl: API_CONFIG.WS_BASE_URL
  });
}

// Helper functions
export const getApiUrl = (endpoint: string = '') => {
  const url = `${API_CONFIG.BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Only add cache busting in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_cb=${Date.now()}`;
  }

  return url;
};

export const getWsUrl = (endpoint: string = '') => {
  return `${API_CONFIG.WS_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

// Standardize API endpoints
export const normalizeEndpoint = (endpoint: string): string => {
  // Remove any leading /api/ to prevent double /api/api/
  let cleanEndpoint = endpoint;
  
  // Remove /api/ from the beginning if present
  if (cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = cleanEndpoint.substring(4); // Remove '/api'
  }
  
  // Ensure it starts with /
  return cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`;
};

// Legacy support - can be removed after migration
export const API_BASE = `${API_CONFIG.BASE_URL}/`;
// export const API_BASE_URL = API_CONFIG.BASE_URL; // Commented out to avoid redeclaration