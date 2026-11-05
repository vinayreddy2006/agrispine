import { API_BASE_URL, APP_CONFIG } from '../constants/config';
import { getAuthToken, clearAuthSession } from '../utils/storage';

/**
 * Standardized API client for AgriSpine Mobile
 * Uses native fetch with custom timeout, auth token attachment, and friendly error parsing.
 */
export const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const isFormData = options.body instanceof FormData || options.isFormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  // Automatically attach auth-token if available
  const token = await getAuthToken();
  if (token && !headers['auth-token']) {
    headers['auth-token'] = token;
  }

  const timeoutMs = options.timeout || APP_CONFIG.TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const config = {
      ...options,
      headers,
      signal: controller.signal,
    };

    if (options.body && typeof options.body === 'object' && !isFormData) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    // Try parsing response as JSON
    let responseData = null;
    const text = await response.text();
    try {
      responseData = text ? JSON.parse(text) : {};
    } catch {
      responseData = { message: text };
    }

    if (!response.ok) {
      // Handle 401 Session Expiration
      if (response.status === 401) {
        const errorMsg = (responseData?.error || responseData?.message || '').toLowerCase();
        if (errorMsg.includes('jwt expired') || errorMsg.includes('token expired') || errorMsg.includes('invalid token')) {
          await clearAuthSession();
        }
      }

      const error = new Error(
        responseData?.message || 
        responseData?.error || 
        `Request failed with status ${response.status}`
      );
      error.status = response.status;
      error.data = responseData;
      throw error;
    }

    return responseData;

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      const timeoutError = new Error(
        `Connection timed out (${timeoutMs / 1000}s). Please verify that your computer and phone are on the same Wi-Fi and that the backend server is running.`
      );
      timeoutError.isTimeout = true;
      throw timeoutError;
    }

    // Network / unreachable server error
    if (error.message && (error.message.includes('Network request failed') || error.message.includes('Failed to fetch'))) {
      const networkError = new Error(
        `Unable to reach the AgriSpine backend at ${API_BASE_URL}. Ensure your phone is connected to the same Wi-Fi as your PC and backend port 5000 is open.`
      );
      networkError.isNetworkError = true;
      throw networkError;
    }

    throw error;
  }
};

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
  upload: (endpoint, formData, options = {}) => 
    request(endpoint, { ...options, method: 'POST', body: formData, isFormData: true }),
};

export default api;
