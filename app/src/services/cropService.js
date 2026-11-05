import api from './api';
import { API_ENDPOINTS } from '../constants/config';

export const cropService = {
  // Fetch all crops for current user
  getAllCrops: async () => {
    return await api.get(API_ENDPOINTS.CROPS_FETCH_ALL);
  },

  // Get single crop details
  getCropById: async (id) => {
    return await api.get(API_ENDPOINTS.CROPS_DETAIL(id));
  },

  // Add new crop
  addCrop: async (cropData) => {
    return await api.post(API_ENDPOINTS.CROPS_ADD, cropData);
  },

  // Delete a crop
  deleteCrop: async (id) => {
    return await api.delete(API_ENDPOINTS.CROPS_DELETE(id));
  },

  // Add expense to a crop
  addExpense: async (cropId, expenseData) => {
    return await api.put(API_ENDPOINTS.CROPS_EXPENSE(cropId), expenseData);
  },

  // Delete expense from a crop
  deleteExpense: async (cropId, expenseId) => {
    return await api.delete(API_ENDPOINTS.CROPS_DELETE_EXPENSE(cropId, expenseId));
  },

  // Record crop sale / harvest completion
  sellCrop: async (cropId, saleData) => {
    return await api.put(API_ENDPOINTS.CROPS_SELL(cropId), saleData);
  },

  // Toggle listing on Buyer Market
  toggleMarketListing: async (cropId, listingData) => {
    return await api.put(API_ENDPOINTS.CROPS_MARKET_TOGGLE(cropId), listingData);
  },

  // Get all active crops listed on the Buyer Market
  getMarketListings: async () => {
    return await api.get(API_ENDPOINTS.MARKET_LISTINGS);
  },
};

export default cropService;

