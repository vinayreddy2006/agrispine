import api from './api';
import { API_ENDPOINTS } from '../constants/config';
import { 
  saveAuthToken, 
  saveUserData, 
  getAuthToken, 
  getUserData, 
  clearAuthSession 
} from '../utils/storage';

/**
 * Authentication Service connecting to existing backend routes:
 * - POST /auth/login
 * - POST /auth/register
 * - POST /auth/getuser
 */

export const loginUser = async (phone, password) => {
  const payload = {
    phone: phone.trim(),
    password,
  };

  const response = await api.post(API_ENDPOINTS.LOGIN, payload);

  // Response structure: { message: "Login successful!", token, user: { ... } }
  if (response.token) {
    await saveAuthToken(response.token);
  }
  if (response.user) {
    await saveUserData(response.user);
  }

  return response;
};

export const registerUser = async (registrationData) => {
  const payload = {
    name: registrationData.name.trim(),
    phone: registrationData.phone.trim(),
    password: registrationData.password,
    userType: registrationData.userType || 'user',
    role: registrationData.role || 'user',
    village: (registrationData.village || '').trim(),
    district: (registrationData.district || '').trim(),
  };

  const response = await api.post(API_ENDPOINTS.REGISTER, payload);
  return response;
};

export const fetchCurrentUser = async () => {
  const response = await api.post(API_ENDPOINTS.GET_USER);
  if (response.user) {
    await saveUserData(response.user);
  }
  return response.user || response;
};

export const logoutUser = async () => {
  await clearAuthSession();
};

export const checkStoredSession = async () => {
  const token = await getAuthToken();
  const user = await getUserData();
  if (token && user) {
    return { token, user };
  }
  return null;
};

export default {
  loginUser,
  registerUser,
  fetchCurrentUser,
  logoutUser,
  checkStoredSession,
};
