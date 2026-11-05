import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { APP_CONFIG } from '../constants/config';

/**
 * Secure Storage Utility for AgriSpine Mobile
 * Uses Android Keystore via expo-secure-store for tokens and sensitive credentials.
 */

export const setItem = async (key, value) => {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (Platform.OS === 'web') {
      localStorage.setItem(key, stringValue);
      return;
    }
    await SecureStore.setItemAsync(key, stringValue);
  } catch (error) {
    console.warn(`[Storage] Failed to set ${key}:`, error);
  }
};

export const getItem = async (key) => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.warn(`[Storage] Failed to get ${key}:`, error);
    return null;
  }
};

export const removeItem = async (key) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.warn(`[Storage] Failed to remove ${key}:`, error);
  }
};

// Convenience helpers for Auth
export const saveAuthToken = async (token) => {
  await setItem(APP_CONFIG.TOKEN_STORAGE_KEY, token);
};

export const getAuthToken = async () => {
  return await getItem(APP_CONFIG.TOKEN_STORAGE_KEY);
};

export const removeAuthToken = async () => {
  await removeItem(APP_CONFIG.TOKEN_STORAGE_KEY);
};

export const saveUserData = async (user) => {
  await setItem(APP_CONFIG.USER_STORAGE_KEY, user);
};

export const getUserData = async () => {
  const data = await getItem(APP_CONFIG.USER_STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

export const removeUserData = async () => {
  await removeItem(APP_CONFIG.USER_STORAGE_KEY);
};

export const clearAuthSession = async () => {
  await removeAuthToken();
  await removeUserData();
};

export default {
  setItem,
  getItem,
  removeItem,
  saveAuthToken,
  getAuthToken,
  removeAuthToken,
  saveUserData,
  getUserData,
  removeUserData,
  clearAuthSession,
};
