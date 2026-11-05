import api from './api';
import { API_ENDPOINTS } from '../constants/config';

export const groupService = {
  // Get all groups joined by user
  getUserGroups: async () => {
    return await api.get(API_ENDPOINTS.GROUPS_BASE);
  },

  // Get personal workgroup dashboard stats
  getPersonalDashboard: async () => {
    return await api.get(API_ENDPOINTS.GROUPS_PERSONAL_DASHBOARD);
  },

  // Create new group
  createGroup: async (groupData) => {
    return await api.post(API_ENDPOINTS.GROUPS_BASE, groupData);
  },

  // Get group details
  getGroupById: async (id) => {
    return await api.get(API_ENDPOINTS.GROUPS_DETAIL(id));
  },

  // Add member
  addMember: async (groupId, memberData) => {
    return await api.put(API_ENDPOINTS.GROUPS_MEMBERS(groupId), memberData);
  },

  // Update member role (admin/member)
  updateMemberRole: async (groupId, memberId, role) => {
    return await api.put(`${API_ENDPOINTS.GROUPS_MEMBERS(groupId)}/${memberId}/role`, { role });
  },

  // Remove member
  removeMember: async (groupId, memberId) => {
    return await api.delete(`${API_ENDPOINTS.GROUPS_MEMBERS(groupId)}/${memberId}`);
  },

  // Get work records for group
  getWorkRecords: async (groupId) => {
    return await api.get(API_ENDPOINTS.GROUPS_WORK(groupId));
  },

  // Record work in group
  createWorkRecord: async (groupId, workData) => {
    return await api.post(API_ENDPOINTS.GROUPS_WORK(groupId), workData);
  },

  // Get settlements
  getSettlements: async (groupId) => {
    return await api.get(API_ENDPOINTS.GROUPS_SETTLEMENTS(groupId));
  },

  // Process settlement
  processSettlement: async (groupId, settlementData) => {
    return await api.post(API_ENDPOINTS.GROUPS_SETTLEMENTS(groupId), settlementData);
  },

  // Group analytics
  getAnalytics: async (groupId) => {
    return await api.get(API_ENDPOINTS.GROUPS_ANALYTICS(groupId));
  },
};

export default groupService;

