import axiosClient from './axiosClient';

export const createGroup = (data) => axiosClient.post('/groups', data);
export const getUserGroups = () => axiosClient.get('/groups');
export const getGroupById = (id) => axiosClient.get(`/groups/${id}`);
export const addGroupMember = (id, data) => axiosClient.put(`/groups/${id}/members`, data);

export const createWorkRecord = (id, data) => axiosClient.post(`/groups/${id}/work`, data);
export const getGroupWorkRecords = (id) => axiosClient.get(`/groups/${id}/work`);

export const processSettlement = (id, data) => axiosClient.post(`/groups/${id}/settlements`, data);
export const getGroupAnalytics = (id) => axiosClient.get(`/groups/${id}/analytics`);

export const getPersonalDashboard = () => axiosClient.get(`/groups/personal/dashboard`);

export const updateMemberRole = (groupId, memberId, data) => axiosClient.put(`/groups/${groupId}/members/${memberId}/role`, data);
export const removeGroupMember = (groupId, memberId) => axiosClient.delete(`/groups/${groupId}/members/${memberId}`);
export const transferOwnership = (groupId, data) => axiosClient.put(`/groups/${groupId}/transfer-ownership`, data);
export const closeGroup = (groupId) => axiosClient.put(`/groups/${groupId}/close`);
export const deleteGroup = (groupId) => axiosClient.delete(`/groups/${groupId}`);
