import api from './api';
import { API_ENDPOINTS } from '../constants/config';

export const bookingService = {
  // Create a machine rental request
  createBooking: async (bookingData) => {
    return await api.post(API_ENDPOINTS.BOOKINGS_CREATE, bookingData);
  },

  // Get current user's bookings as a renter
  getRenterBookings: async () => {
    return await api.get(API_ENDPOINTS.BOOKINGS_RENTER);
  },

  // Get owner's incoming booking requests for their machines
  getOwnerRequests: async () => {
    return await api.get(API_ENDPOINTS.BOOKINGS_REQUESTS);
  },

  // Update booking status (accepted, rejected, completed, cancelled)
  updateStatus: async (bookingId, status) => {
    return await api.put(API_ENDPOINTS.BOOKINGS_STATUS(bookingId), { status });
  },

  // Get booked dates for machine calendar schedule
  getBookedDates: async (machineId) => {
    return await api.get(API_ENDPOINTS.BOOKINGS_MACHINE_DATES(machineId));
  },

  // Delete booking
  deleteBooking: async (bookingId) => {
    return await api.delete(API_ENDPOINTS.BOOKINGS_DELETE(bookingId));
  },

  // Submit review for completed booking
  addReview: async (reviewData) => {
    return await api.post(API_ENDPOINTS.REVIEWS_ADD, reviewData);
  },

  // Get machine reviews
  getMachineReviews: async (machineId) => {
    return await api.get(API_ENDPOINTS.REVIEWS_MACHINE(machineId));
  },
};

export default bookingService;

