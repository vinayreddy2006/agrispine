import api from './api';
import { API_ENDPOINTS } from '../constants/config';

export const chatService = {
  // Get all user conversations
  getConversations: async () => {
    return await api.get(API_ENDPOINTS.CHAT_CONVERSATIONS);
  },

  // Create or get conversation
  createConversation: async ({ participantIds, isGroup = false, groupName = '' }) => {
    return await api.post(API_ENDPOINTS.CHAT_CONVERSATIONS, {
      participantIds,
      isGroup,
      groupName,
    });
  },

  // Get messages for a conversation
  getMessages: async (conversationId) => {
    return await api.get(API_ENDPOINTS.CHAT_MESSAGES(conversationId));
  },

  // Upload attachment (photo, audio, file)
  uploadFile: async (formData) => {
    return await api.upload(API_ENDPOINTS.CHAT_UPLOAD, formData);
  },

  // Star message
  starMessage: async (id) => {
    return await api.put(API_ENDPOINTS.CHAT_STAR_MSG(id));
  },

  // React to message
  reactToMessage: async (id, emoji) => {
    return await api.put(API_ENDPOINTS.CHAT_REACT_MSG(id), { emoji });
  },

  // Delete message
  deleteMessage: async (id) => {
    return await api.delete(API_ENDPOINTS.CHAT_DELETE_MSG(id));
  },

  // Clear chat
  clearChat: async (conversationId) => {
    return await api.delete(API_ENDPOINTS.CHAT_CLEAR(conversationId));
  },

  // Pin message in conversation
  pinMessage: async (conversationId, messageId) => {
    return await api.put(API_ENDPOINTS.CHAT_PIN(conversationId), { messageId });
  },

  // Create Poll
  createPoll: async ({ question, options, multipleChoice = false, conversationId }) => {
    return await api.post(API_ENDPOINTS.POLL_CREATE, {
      question,
      options,
      multipleChoice,
      conversationId,
    });
  },

  // Vote on Poll
  votePoll: async (pollId, optionIndex) => {
    return await api.put(API_ENDPOINTS.POLL_VOTE(pollId), { optionIndex });
  },
};

export default chatService;
