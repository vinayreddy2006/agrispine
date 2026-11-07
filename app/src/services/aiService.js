import api from './api';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/config';

export const aiService = {
  // Check AI & Backend Health
  checkHealth: async () => {
    return await api.get(API_ENDPOINTS.AI_HEALTH);
  },

  // Get all AI chat sessions
  getChatSessions: async () => {
    return await api.get(API_ENDPOINTS.AI_CHATS);
  },

  // Create new AI chat session
  createChatSession: async () => {
    if (__DEV__) {
      console.log(`[GramSathi] Creating new chat session at ${API_BASE_URL}${API_ENDPOINTS.AI_NEW_CHAT}`);
    }
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

  // Rename chat session
  renameChat: async (id, title) => {
    return await api.put(API_ENDPOINTS.AI_CHAT_DETAIL(id), { title });
  },

  // Send message to GramSathi AI
  sendMessage: async ({ sessionId, message, language = 'en' }) => {
    const startTime = Date.now();
    if (__DEV__) {
      console.log(`[GramSathi] Sending chat message to ${API_BASE_URL}${API_ENDPOINTS.AI_CHAT_SEND} (session: ${sessionId}, lang: ${language})`);
    }
    try {
      const res = await api.post(API_ENDPOINTS.AI_CHAT_SEND, {
        session_id: sessionId,
        message,
        language,
        current_page_context: { path: '/mobile/ai-chat' },
      });
      if (__DEV__) {
        console.log(`[GramSathi] Response received in ${Date.now() - startTime}ms`);
      }
      return res;
    } catch (err) {
      if (__DEV__) {
        console.warn(`[GramSathi] Chat request failed after ${Date.now() - startTime}ms:`, {
          status: err.status,
          message: err.message,
          data: err.data,
          isTimeout: err.isTimeout,
          isNetwork: err.isNetworkError,
        });
      }
      throw err;
    }
  },

  // Transcribe voice recording into text
  transcribeAudio: async (formData) => {
    const startTime = Date.now();
    if (__DEV__) {
      console.log(`[GramSathi] Sending audio to ${API_BASE_URL}${API_ENDPOINTS.AI_TRANSCRIBE} for transcription`);
    }
    try {
      const res = await api.upload(API_ENDPOINTS.AI_TRANSCRIBE, formData);
      if (__DEV__) {
        console.log(`[GramSathi] Transcription received in ${Date.now() - startTime}ms:`, res?.text);
      }
      return res;
    } catch (err) {
      if (__DEV__) {
        console.warn(`[GramSathi] Transcription request failed after ${Date.now() - startTime}ms:`, {
          status: err.status,
          message: err.message,
          data: err.data,
        });
      }
      throw err;
    }
  },

  // Send voice audio to GramSathi AI
  sendVoiceMessage: async (formData) => {
    const startTime = Date.now();
    if (__DEV__) {
      console.log(`[GramSathi] Sending voice recording to ${API_BASE_URL}${API_ENDPOINTS.AI_VOICE}`);
    }
    try {
      const res = await api.upload(API_ENDPOINTS.AI_VOICE, formData);
      if (__DEV__) {
        console.log(`[GramSathi] Voice response received in ${Date.now() - startTime}ms`);
      }
      return res;
    } catch (err) {
      if (__DEV__) {
        console.warn(`[GramSathi] Voice request failed after ${Date.now() - startTime}ms:`, {
          status: err.status,
          message: err.message,
          data: err.data,
        });
      }
      throw err;
    }
  },

  // Get agricultural weather recommendations
  getWeatherAdvisory: async (weatherData) => {
    return await api.post(API_ENDPOINTS.AI_WEATHER_ADVISORY, weatherData);
  },
};

export default aiService;

