import { API_CONFIG, FALLBACK_URLS, normalizeEndpoint } from '@/config/api';
import { authService } from '@/services/authService';
import { isDevelopment, checkBackendHealth, showBackendWarning } from '@/utils/devUtils';

// Track if we've already shown the backend warning
let backendWarningShown = false;

export const createApiHeaders = async (includeAuth = true, isFormData = false, endpoint = '') => {
  const headers: Record<string, string> = {
    'ngrok-skip-browser-warning': 'true',
    'x-ngrok-skip-browser-warning': 'true',
  };

  // Only set Content-Type for non-FormData requests
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (includeAuth) {
    let token = await authService.getToken();
    console.log('🔑 Main token for', endpoint, ':', token ? `${token.substring(0, 10)}...` : 'NO TOKEN');
    
    // If no main token, try vendor token as fallback
    if (!token) {
      try {
        const { simplePersistentAuth } = await import('@/services/simplePersistentAuth');
        const vendorAuth = await simplePersistentAuth.getVendorAuth();
        if (vendorAuth?.token) {
          token = vendorAuth.token;
          console.log('🔄 Using vendor token as fallback for:', endpoint, `${token.substring(0, 10)}...`);
          
          // Sync vendor token back to main auth to prevent future issues
          const { authService } = await import('@/services/authService');
          await authService.setAuth(vendorAuth.token, vendorAuth.user);
          console.log('⚙️ Synced vendor token to main auth');
        } else {
          console.log('❌ No vendor token available');
        }
      } catch (error) {
        console.error('Failed to get vendor token:', error);
      }
    }
    
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    } else {
      console.log('⚠️ No token available for:', endpoint);
    }
  }

  return headers;
};

export const apiRequest = async (endpoint: string, options: RequestInit = {}, includeAuth = true) => {
  // Fix double /api/ issue using the normalizeEndpoint function
  let cleanEndpoint = normalizeEndpoint(endpoint);
  
  // Log any calls to non-existent vendor settings endpoints
  if (cleanEndpoint.includes('/vendors/settings') || cleanEndpoint.includes('/vendor-profiles/settings')) {
    console.error('🚀 FOUND THE PROBLEMATIC CALL:', endpoint);
    console.error('🚀 Stack trace:', new Error().stack);
    // Return early with a rejected promise to prevent the 404
    return Promise.resolve({
      response: { ok: false, status: 404 } as Response,
      data: { error: 'Endpoint does not exist on server' }
    });
  }
  
  // Map vendor/orders to orders
  if (cleanEndpoint.includes('/vendor/orders')) {
    cleanEndpoint = '/orders/';
    console.log('🔧 Mapped vendor/orders to orders:', endpoint, '->', cleanEndpoint);
  }
  
  const url = `${API_CONFIG.BASE_URL}${cleanEndpoint}`;

  // Check if body is FormData to avoid setting Content-Type
  const isFormData = options.body instanceof FormData;

  const defaultOptions: RequestInit = {
    headers: await createApiHeaders(includeAuth, isFormData, endpoint),
    ...options,
  };

  // Debug logging for authentication - check all requests for now
  console.log('🌐 API Request:', endpoint, 'Auth:', includeAuth);
  console.log('📍 Full URL:', url);
  
  // Special logging for order accept requests
  if (endpoint.includes('accept')) {
    console.log('🎯 ORDER ACCEPT REQUEST DETECTED!');
    console.log('📍 Original endpoint:', endpoint);
    console.log('📍 Normalized endpoint:', normalizedEndpoint);
    console.log('📍 API_CONFIG.BASE_URL:', API_CONFIG.BASE_URL);
    console.log('📍 Final URL:', url);
  }
  if (endpoint.includes('switch-role') || endpoint.includes('switch')) {
    console.log('🎯 SWITCH ROLE REQUEST DETECTED!');
    console.log('📍 Full URL:', url);
    console.log('🔐 Include Auth:', includeAuth);
    console.log('📋 Request Headers:', JSON.stringify(defaultOptions.headers, null, 2));

    // Check token specifically
    const { authService } = await import('@/services/authService');
    const token = await authService.getToken();
    console.log('🔑 Token from authService:', token ? `${token.substring(0, 10)}...` : 'NO TOKEN');

    // Check localStorage directly
    const localToken = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : 'NO LOCALSTORAGE';
    console.log('💾 localStorage token:', localToken ? `${localToken.substring(0, 10)}...` : 'NO TOKEN IN LOCALSTORAGE');

    // Check if Authorization header exists
    const authHeader = defaultOptions.headers?.['Authorization'] || defaultOptions.headers?.['authorization'];
    console.log('🔐 Authorization header:', authHeader ? `${authHeader.substring(0, 15)}...` : 'NO AUTH HEADER');
  }

  // Merge headers if provided in options, but don't override Content-Type for FormData
  if (options.headers) {
    defaultOptions.headers = {
      ...defaultOptions.headers,
      ...options.headers,
    };
    
    // Remove Content-Type if it's FormData to let browser set it with boundary
    if (isFormData && defaultOptions.headers['Content-Type']) {
      delete defaultOptions.headers['Content-Type'];
    }
  }

  try {
    const response = await fetch(url, defaultOptions);
    

    
    // Clone response to avoid "body stream already read" error
    const responseClone = response.clone();
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const data = await response.json();
        return { response: responseClone, data };
      } catch (jsonError) {
        console.warn('Failed to parse JSON response:', jsonError);
        return { response: responseClone, data: null };
      }
    } else {
      console.warn('API returned non-JSON response:', response.status, response.statusText);
      return { response: responseClone, data: null };
    }
  } catch (error) {
    console.error('API request failed:', error);
    
    // Show backend warning in development if not already shown
    if (isDevelopment() && !backendWarningShown && error.message?.includes('fetch')) {
      backendWarningShown = true;
      showBackendWarning();
    }
    
    // If ngrok fails, try fallback URLs
    if (url.includes('ngrok-free.app') && (error.message?.includes('Unable to resolve host') || error.message?.includes('UnknownHostException'))) {
      console.log('Ngrok failed, trying fallback URLs...');
      
      for (let i = 1; i < FALLBACK_URLS.length; i++) {
        const fallbackBaseUrl = FALLBACK_URLS[i];
        const fallbackUrl = `${fallbackBaseUrl}${normalizedEndpoint}`;
        
        try {
          console.log(`Trying fallback URL: ${fallbackUrl}`);
          const fallbackResponse = await fetch(fallbackUrl, {
            ...defaultOptions,
            headers: {
              ...defaultOptions.headers,
              'ngrok-skip-browser-warning': undefined,
              'x-ngrok-skip-browser-warning': undefined,
            }
          });
          
          const fallbackClone = fallbackResponse.clone();
          const contentType = fallbackResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              const data = await fallbackResponse.json();
              console.log(`Fallback URL ${fallbackUrl} succeeded`);
              return { response: fallbackClone, data };
            } catch (jsonError) {
              console.log(`Fallback URL ${fallbackUrl} succeeded (non-JSON)`);
              return { response: fallbackClone, data: null };
            }
          } else {
            console.log(`Fallback URL ${fallbackUrl} succeeded (non-JSON)`);
            return { response: fallbackClone, data: null };
          }
        } catch (fallbackError) {
          console.error(`Fallback URL ${fallbackUrl} failed:`, fallbackError);
          continue;
        }
      }
    }
    
    throw error;
  }
};