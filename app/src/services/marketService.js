import api from './api';
import { API_ENDPOINTS } from '../constants/config';

export const marketService = {
  // Get live mandi market rates
  getMandiRates: async () => {
    return await api.get(API_ENDPOINTS.MANDI_RATES);
  },
};

export default marketService;

