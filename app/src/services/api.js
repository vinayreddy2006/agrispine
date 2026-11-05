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

/**
 * Robust multipart upload using XMLHttpRequest to natively support file streaming,
 * real-time upload progress, and proper boundary headers across Android & iOS without
 * WinterCG fetch FormData limitations.
 */
export const uploadWithProgress = async (endpoint, formData, options = {}) => {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = await getAuthToken();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    if (token) {
      xhr.setRequestHeader('auth-token', token);
    }
    if (options.headers) {
      Object.entries(options.headers).forEach(([k, v]) => {
        if (k.toLowerCase() !== 'content-type') {
          xhr.setRequestHeader(k, v);
        }
      });
    }

    xhr.timeout = options.timeout || 60000;

    xhr.onload = () => {
      let responseData = null;
      try {
        responseData = xhr.responseText ? JSON.parse(xhr.responseText) : {};
      } catch {
        responseData = { message: xhr.responseText };
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(responseData);
      } else {
        const errMsg = responseData?.error || responseData?.message || `Upload failed with status ${xhr.status}`;
        reject(new Error(errMsg));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during file upload. Please check your connection.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Upload timed out. Please try with smaller files or a better connection.'));
    };

    if (options.onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          options.onProgress(event.loaded / event.total);
        }
      };
    }

    xhr.send(formData);
  });
};

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
  upload: (endpoint, formData, options = {}) => uploadWithProgress(endpoint, formData, options),
};

export default api;
