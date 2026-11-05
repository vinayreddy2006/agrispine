import api from './api';
import { API_ENDPOINTS } from '../constants/config';

export const aiService = {
  // Get all AI chat sessions
  getChatSessions: async () => {
    return await api.get(API_ENDPOINTS.AI_CHATS);
  },

  // Create new AI chat session
  createChatSession: async () => {
    return await api.post(API_ENDPOINTS.AI_NEW_CHAT, {});
  },

  // Get chat session messages
  getChatById: async (id) => {
    return await api.get(API_ENDPOINTS.AI_CHAT_DETAIL(id));
  },

  // Delete chat session
  deleteChat: async (id) => {
    return await api.delete(API_ENDPOINTS.AI_CHAT_DETAIL(id));
  },

  // Send message to GramSathi AI
  sendMessage: async ({ sessionId, message, language = 'en' }) => {
    return await api.post(API_ENDPOINTS.AI_CHAT_SEND, {
      session_id: sessionId,
      message,
      language,
      current_page_context: { path: '/mobile/ai-chat' },
    });
  },

  // Get agricultural weather recommendations
  getWeatherAdvisory: async (weatherData) => {
    return await api.post(API_ENDPOINTS.AI_WEATHER_ADVISORY, weatherData);
  },
};

export default aiService;

