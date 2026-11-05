import api from './api';
import { API_ENDPOINTS } from '../constants/config';

export const schemeService = {
  // Get government agricultural schemes
  getSchemes: async () => {
    return await api.get(API_ENDPOINTS.SCHEMES);
  },
};

export default schemeService;

