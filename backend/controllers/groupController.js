import {
    createGroupService,
    getUserGroupsService,
    getGroupByIdService,
    addMemberService,
    createWorkRecordService,
    getGroupWorkRecordsService,
    processSettlementService,
    getGroupAnalyticsService,
    getPersonalDashboardService
} from '../services/groupService.js';

export const createGroup = async (req, res) => {
    try {
        const group = await createGroupService(req.body, req.user.id);
        res.status(201).json({ success: true, group });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserGroups = async (req, res) => {
    try {
        const groups = await getUserGroupsService(req.user.id);
        res.status(200).json({ success: true, groups });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getGroupById = async (req, res) => {
    try {
        const group = await getGroupByIdService(req.params.id);
        if (!group) return res.status(404).json({ success: false, message: "Group not found" });
        res.status(200).json({ success: true, group });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addGroupMember = async (req, res) => {
    try {
        const group = await addMemberService(req.params.id, req.body);
        res.status(200).json({ success: true, group });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createWorkRecord = async (req, res) => {
    try {
        const record = await createWorkRecordService(req.params.id, req.body, req.user.id);
        res.status(201).json({ success: true, record });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getGroupWorkRecords = async (req, res) => {
    try {
        const records = await getGroupWorkRecordsService(req.params.id);
        res.status(200).json({ success: true, records });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const processSettlement = async (req, res) => {
    try {
        const settlement = await processSettlementService(req.params.id, req.body, req.user.id);
        res.status(201).json({ success: true, settlement });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getGroupAnalytics = async (req, res) => {
    try {
        const analytics = await getGroupAnalyticsService(req.params.id);
        res.status(200).json({ success: true, analytics });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPersonalDashboard = async (req, res) => {
    try {
        const dashboardData = await getPersonalDashboardService(req.user.id);
        res.status(200).json({ success: true, data: dashboardData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateMemberRole = async (req, res) => {
    try {
        const { groupId, memberId } = req.params;
        const { role } = req.body;
        // Assuming a service method exists
        const group = await import('../services/groupService.js').then(m => m.updateMemberRoleService(req.params.id, req.params.memberId, req.body.role, req.user.id));
        res.status(200).json({ success: true, group });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const removeGroupMember = async (req, res) => {
    try {
        const group = await import('../services/groupService.js').then(m => m.removeGroupMemberService(req.params.id, req.params.memberId, req.user.id));
        res.status(200).json({ success: true, group });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const transferOwnership = async (req, res) => {
    try {
        const group = await import('../services/groupService.js').then(m => m.transferOwnershipService(req.params.id, req.body.newOwnerId, req.user.id));
        res.status(200).json({ success: true, group });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const closeGroup = async (req, res) => {
    try {
        const group = await import('../services/groupService.js').then(m => m.closeGroupService(req.params.id, req.user.id));
        res.status(200).json({ success: true, group });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteGroup = async (req, res) => {
    try {
        const result = await import('../services/groupService.js').then(m => m.deleteGroupService(req.params.id, req.user.id));
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getGroupSettlements = async (req, res) => {
    try {
        const settlements = await import('../services/groupService.js').then(m => m.getGroupSettlementsService(req.params.id));
        res.status(200).json({ success: true, settlements });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
