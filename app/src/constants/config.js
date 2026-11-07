/**
 * AgriSpine Mobile Centralized Configuration
 * 
 * When running on a physical Android device via Expo Go:
 * 1. Your phone and PC must be on the same Wi-Fi network.
 * 2. EXPO_PUBLIC_API_URL should point to your PC's local IPv4 address (e.g., http://192.168.1.43:5000).
 * 3. Never use 'localhost' or '127.0.0.1' on a physical mobile device because they point to the phone itself.
 */

// Fallback to current development machine LAN IP if environment variable is not set
const DEFAULT_LAN_URL = 'http://10.85.213.163:5000';

const rawApiUrl = process.env.EXPO_PUBLIC_API_URL || DEFAULT_LAN_URL;

// Normalize URL (strip trailing slashes)
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

export const API_ENDPOINTS = {
  // Authentication & Profile
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  GET_USER: '/auth/getuser',
  CONFIRM_LOCATION: '/auth/confirm-location',
  UPDATE_PROFILE: '/auth/updateprofile',
  SEARCH_USERS: '/auth/search-users',
  PROFILE_ANALYTICS: '/auth/profile-analytics',

  // Crops & Farming
  CROPS_FETCH_ALL: '/crops/fetchall',
  CROPS_ADD: '/crops/add',
  CROPS_DETAIL: (id) => `/crops/${id}`,
  CROPS_DELETE: (id) => `/crops/delete/${id}`,
  CROPS_EXPENSE: (id) => `/crops/expense/${id}`,
  CROPS_DELETE_EXPENSE: (cropId, expenseId) => `/crops/expense/${cropId}/${expenseId}`,
  CROPS_SELL: (id) => `/crops/sell/${id}`,
  CROPS_MARKET_TOGGLE: (id) => `/crops/market/toggle/${id}`,
  MARKET_LISTINGS: '/crops/market/listings',

  // Machinery
  MACHINES_FETCH_ALL: '/machines/fetchall',
  MACHINES_DETAIL: (id) => `/machines/detail/${id}`,
  MACHINES_ADD: '/machines/add',
  MACHINES_UPDATE: (id) => `/machines/update/${id}`,
  MACHINES_DELETE: (id) => `/machines/delete/${id}`,
  MACHINES_BY_TYPE: (type) => `/machines/type/${type}`,
  MACHINES_MY_FLEET: '/machines/own',
  MACHINE_SERVICES: (id) => `/machines/${id}/services`,

  // Bookings & Reviews
  BOOKINGS_CREATE: '/bookings/book',
  BOOKINGS_RENTER: '/bookings/renter',
  BOOKINGS_REQUESTS: '/bookings/requests',
  BOOKINGS_STATUS: (id) => `/bookings/status/${id}`,
  BOOKINGS_MACHINE_DATES: (machineId) => `/bookings/machine/${machineId}`,
  BOOKINGS_DELETE: (id) => `/bookings/delete/${id}`,
  REVIEWS_ADD: '/reviews/add',
  REVIEWS_MACHINE: (machineId) => `/reviews/machine/${machineId}`,

  // Community
  COMMUNITY_FETCH_ALL: '/community/fetchall',
  COMMUNITY_POST_DETAIL: (id) => `/community/post/${id}`,
  COMMUNITY_CREATE: '/community/add',
  COMMUNITY_UPDATE: (id) => `/community/post/${id}`,
  COMMUNITY_DELETE: (id) => `/community/post/${id}`,
  COMMUNITY_LIKE: (id) => `/community/like/${id}`,
  COMMUNITY_COMMENT: (id) => `/community/comment/${id}`,
  COMMUNITY_DELETE_COMMENT: (postId, commentId) => `/community/comment/${postId}/${commentId}`,
  COMMUNITY_REPLY: (postId, commentId) => `/community/reply/${postId}/${commentId}`,
  COMMUNITY_DELETE_REPLY: (postId, commentId, replyId) => `/community/reply/${postId}/${commentId}/${replyId}`,
  COMMUNITY_LIKE_COMMENT: (postId, commentId) => `/community/like-comment/${postId}/${commentId}`,
  COMMUNITY_LIKE_REPLY: (postId, commentId, replyId) => `/community/like-reply/${postId}/${commentId}/${replyId}`,
  COMMUNITY_UPLOAD: '/community/upload',
  COMMUNITY_REPORT: (id) => `/community/report/${id}`,

  // Real-time Chat
  CHAT_CONVERSATIONS: '/chat/conversations',
  CHAT_MESSAGES: (convId) => `/chat/messages/${convId}`,
  CHAT_CLEAR: (convId) => `/chat/clear/${convId}`,
  CHAT_DELETE_MSG: (id) => `/chat/delete/${id}`,
  CHAT_STAR_MSG: (id) => `/chat/star/${id}`,
  CHAT_REACT_MSG: (id) => `/chat/react/${id}`,
  CHAT_UPLOAD: '/chat/upload',
  CHAT_PIN: (convId) => `/chat/conversations/${convId}/pin`,

  // Polls
  POLL_CREATE: '/poll/create',
  POLL_VOTE: (id) => `/poll/vote/${id}`,
  POLL_DETAIL: (id) => `/poll/${id}`,

  // Workgroups
  GROUPS_BASE: '/api/groups',
  GROUPS_PERSONAL_DASHBOARD: '/api/groups/personal/dashboard',
  GROUPS_DETAIL: (id) => `/api/groups/${id}`,
  GROUPS_MEMBERS: (id) => `/api/groups/${id}/members`,
  GROUPS_WORK: (id) => `/api/groups/${id}/work`,
  GROUPS_SETTLEMENTS: (id) => `/api/groups/${id}/settlements`,
  GROUPS_ANALYTICS: (id) => `/api/groups/${id}/analytics`,

  // Mandi & Schemes
  MANDI_RATES: '/admin/mandi-rates',
  SCHEMES: '/admin/schemes',

  // AI & Voice Assistant
  AI_HEALTH: '/api/ai/health',
  AI_CHATS: '/api/ai/chats',
  AI_NEW_CHAT: '/api/ai/chats/new',
  AI_CHAT_DETAIL: (id) => `/api/ai/chats/${id}`,
  AI_CHAT_SEND: '/api/ai/chat',
  AI_VOICE: '/api/ai/voice',
  AI_TRANSCRIBE: '/api/ai/transcribe',
  AI_WEATHER_ADVISORY: '/api/ai/weather-recommendations',

  // Notifications
  NOTIFICATIONS: '/api/notifications',
  NOTIFICATIONS_MARK_ALL: '/api/notifications/mark-all-read',
  NOTIFICATIONS_MARK_READ: (id) => `/api/notifications/${id}/read`,
};

export const WEATHER_CONFIG = {
  API_KEY: '35e669987b8f3f982e649b224ed22c0c',
  BASE_URL: 'https://api.openweathermap.org/data/2.5',
};

export const APP_CONFIG = {
  APP_NAME: 'AgriSpine',
  TAGLINE: 'Empowering Farmers with Technology',
  TIMEOUT_MS: 15000,
  TOKEN_STORAGE_KEY: 'agrispine_auth_token',
  USER_STORAGE_KEY: 'agrispine_user_data',
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  APP_CONFIG,
};
