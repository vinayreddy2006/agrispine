import api from './api';
import { API_ENDPOINTS } from '../constants/config';

export const communityService = {
  // Get all community posts
  getAllPosts: async () => {
    return await api.get(API_ENDPOINTS.COMMUNITY_FETCH_ALL);
  },

  // Get single post by ID
  getPostById: async (id) => {
    return await api.get(API_ENDPOINTS.COMMUNITY_POST_DETAIL(id));
  },

  // Create post
  createPost: async (postData) => {
    return await api.post(API_ENDPOINTS.COMMUNITY_CREATE, postData);
  },

  // Delete post
  deletePost: async (id) => {
    return await api.delete(API_ENDPOINTS.COMMUNITY_DELETE(id));
  },

  // Like / Unlike post (PUT /community/like/:id)
  toggleLike: async (id) => {
    return await api.put(API_ENDPOINTS.COMMUNITY_LIKE(id));
  },

  // Add comment (POST /community/comment/:id with { text })
  addComment: async (id, commentText) => {
    return await api.post(API_ENDPOINTS.COMMUNITY_COMMENT(id), {
      text: commentText,
      comment: commentText,
    });
  },

  // Delete comment
  deleteComment: async (postId, commentId) => {
    return await api.delete(API_ENDPOINTS.COMMUNITY_DELETE_COMMENT(postId, commentId));
  },

  // Upload media files (photos/videos) for post (POST /community/upload)
  uploadMedia: async (formData) => {
    return await api.upload(API_ENDPOINTS.COMMUNITY_UPLOAD, formData);
  },

  // Report post
  reportPost: async (id, reason) => {
    return await api.post(API_ENDPOINTS.COMMUNITY_REPORT(id), { reason });
  },
};

export default communityService;
