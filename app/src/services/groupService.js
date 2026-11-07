import api from './api';
import { API_ENDPOINTS } from '../constants/config';

export const groupService = {
  // Get all groups joined or administered by user
  getUserGroups: async () => {
    const res = await api.get(API_ENDPOINTS.GROUPS_BASE);
    if (res && Array.isArray(res.groups)) return res.groups;
    if (Array.isArray(res)) return res;
    if (res && res.data && Array.isArray(res.data.groups)) return res.data.groups;
    return [];
  },

  // Get personal workgroup dashboard stats
  getPersonalDashboard: async () => {
    const res = await api.get(API_ENDPOINTS.GROUPS_PERSONAL_DASHBOARD);
    if (res && res.data) return res.data;
    if (res && res.stats) return res;
    return res || null;
  },

  // Create new group
  createGroup: async (groupData) => {
    const res = await api.post(API_ENDPOINTS.GROUPS_BASE, groupData);
    return res?.group || res;
  },

  // Get group details
  getGroupById: async (id) => {
    const res = await api.get(API_ENDPOINTS.GROUPS_DETAIL(id));
    return res?.group || res;
  },

  // Add member
  addMember: async (groupId, memberData) => {
    const res = await api.put(API_ENDPOINTS.GROUPS_MEMBERS(groupId), memberData);
    return res?.group || res;
  },

  // Update member role (admin / member)
  updateMemberRole: async (groupId, memberId, role) => {
    const res = await api.put(`${API_ENDPOINTS.GROUPS_MEMBERS(groupId)}/${memberId}/role`, { role });
    return res?.group || res;
  },

  // Remove member
  removeMember: async (groupId, memberId) => {
    const res = await api.delete(`${API_ENDPOINTS.GROUPS_MEMBERS(groupId)}/${memberId}`);
    return res?.group || res;
  },

  // Transfer ownership (owner only)
  transferOwnership: async (groupId, newOwnerId) => {
    const res = await api.put(`${API_ENDPOINTS.GROUPS_BASE}/${groupId}/transfer-ownership`, { newOwnerId });
    return res?.group || res;
  },

  // Close group (owner only)
  closeGroup: async (groupId) => {
    const res = await api.put(`${API_ENDPOINTS.GROUPS_BASE}/${groupId}/close`);
    return res?.group || res;
  },

  // Delete group (owner only)
  deleteGroup: async (groupId) => {
    return await api.delete(`${API_ENDPOINTS.GROUPS_BASE}/${groupId}`);
  },

  // Get work records for group
  getWorkRecords: async (groupId) => {
    const res = await api.get(API_ENDPOINTS.GROUPS_WORK(groupId));
    if (res && Array.isArray(res.records)) return res.records;
    if (Array.isArray(res)) return res;
    return [];
  },

  // Record work in group
  createWorkRecord: async (groupId, workData) => {
    const res = await api.post(API_ENDPOINTS.GROUPS_WORK(groupId), workData);
    return res?.record || res;
  },

  // Get settlements
  getSettlements: async (groupId) => {
    const res = await api.get(API_ENDPOINTS.GROUPS_SETTLEMENTS(groupId));
    if (res && Array.isArray(res.settlements)) return res.settlements;
    if (Array.isArray(res)) return res;
    return [];
  },

  // Process settlement
  processSettlement: async (groupId, settlementData) => {
    const res = await api.post(API_ENDPOINTS.GROUPS_SETTLEMENTS(groupId), settlementData);
    return res?.settlement || res;
  },

  // Group analytics
  getAnalytics: async (groupId) => {
    const res = await api.get(API_ENDPOINTS.GROUPS_ANALYTICS(groupId));
    if (res && res.analytics) return res.analytics;
    return res || {};
  },
};

export default groupService;
