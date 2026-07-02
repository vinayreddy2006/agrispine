import express from 'express';
import fetchUser from '../middlewares/fetchuser.js';
import {
    createGroup,
    getUserGroups,
    getGroupById,
    addGroupMember,
    createWorkRecord,
    getGroupWorkRecords,
    processSettlement,
    getGroupAnalytics,
    getPersonalDashboard,
    updateMemberRole,
    removeGroupMember,
    transferOwnership,
    closeGroup
} from '../controllers/groupController.js';

const router = express.Router();

// Group Management
router.post('/', fetchUser, createGroup);
router.get('/', fetchUser, getUserGroups);
router.get('/personal/dashboard', fetchUser, getPersonalDashboard);
router.get('/:id', fetchUser, getGroupById);
router.put('/:id/members', fetchUser, addGroupMember);
router.put('/:id/members/:memberId/role', fetchUser, updateMemberRole);
router.delete('/:id/members/:memberId', fetchUser, removeGroupMember);
router.put('/:id/transfer-ownership', fetchUser, transferOwnership);
router.put('/:id/close', fetchUser, closeGroup);
// Work Records
router.post('/:id/work', fetchUser, createWorkRecord);
router.get('/:id/work', fetchUser, getGroupWorkRecords);

// Settlements & Analytics
router.post('/:id/settlements', fetchUser, processSettlement);
router.get('/:id/analytics', fetchUser, getGroupAnalytics);

export default router;
