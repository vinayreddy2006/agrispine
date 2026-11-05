import api from './api';
import { API_ENDPOINTS } from '../constants/config';

export const notificationService = {
  // Get all notifications
  getNotifications: async () => {
    return await api.get(API_ENDPOINTS.NOTIFICATIONS);
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    return await api.put(API_ENDPOINTS.NOTIFICATIONS_MARK_ALL, {});
  },

  // Mark single notification as read
  markAsRead: async (id) => {
    return await api.put(API_ENDPOINTS.NOTIFICATIONS_MARK_READ(id), {});
  },
};

export default notificationService;

