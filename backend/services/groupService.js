import WorkGroup from '../models/WorkGroup.js';
import WorkRecord from '../models/WorkRecord.js';
import Settlement from '../models/Settlement.js';

import User from '../models/User.js';
import { sendNotification, sendGroupNotification } from '../utils/notificationHelper.js';

export const createGroupService = async (data, userId) => {
    const user = await User.findById(userId);
    const group = new WorkGroup({
        name: data.name,
        village: data.village,
        admins: [userId],
        createdBy: userId,
        members: [{
            user: userId,
            name: user ? user.name : 'Creator',
            phone: user ? user.phone : '',
            isOffline: false,
            role: 'owner',
            status: 'active'
        }]
    });
    return await group.save();
};

export const getUserGroupsService = async (userId) => {
    // Return groups where user is admin OR member
    return await WorkGroup.find({
        $or: [
            { admins: userId },
            { 'members.user': userId },
            { createdBy: userId }
        ]
    }).sort({ updatedAt: -1 });
};

export const getGroupByIdService = async (groupId) => {
    return await WorkGroup.findById(groupId).populate('admins', 'name phone').populate('members.user', 'name phone');
};

export const addMemberService = async (groupId, memberData) => {
    const group = await WorkGroup.findById(groupId);
    if (!group) throw new Error("Group not found");

    let userId = memberData.userId || null;
    let name = memberData.name;
    let isOffline = true;

    if (memberData.phone) {
        const existingUser = await User.findOne({ phone: memberData.phone });
        if (existingUser) {
            userId = existingUser._id;
            name = existingUser.name; // Prefer registered name
            isOffline = false;
        }
    }

    const alreadyMember = group.members.find(m => 
        (userId && m.user?.toString() === userId.toString()) || 
        (!userId && m.phone === memberData.phone && m.name === name)
    );
    if (alreadyMember) throw new Error("Member already exists in this group");

    group.members.push({
        user: userId,
        name: name,
        phone: memberData.phone || '',
        village: memberData.village || '',
        notes: memberData.notes || '',
        isOffline: isOffline,
        role: 'member',
        status: 'active'
    });

    await group.save();

    // Send notification to the group
    await sendGroupNotification(
        group,
        'New Member Added',
        `${name} has been added to ${group.name}`,
        'GROUP_ADDED',
        userId // Exclude the newly added user from the group broadcast
    );
    // Send specific notification to the new user if online
    if (userId) {
        await sendNotification(userId, 'Added to Group', `You have been added to ${group.name}`, 'GROUP_ADDED', group._id);
    }

    return group;
};

export const createWorkRecordService = async (groupId, data, userId) => {
    const total = (data.acres * data.ratePerAcre) + (data.additionalCharges || 0);
    const wage = total / data.attendance.length;

    const record = new WorkRecord({
        group: groupId,
        date: data.date,
        landOwnerName: data.landOwnerName,
        crop: data.crop,
        activityType: data.activityType,
        acres: data.acres,
        ratePerAcre: data.ratePerAcre,
        additionalCharges: data.additionalCharges || 0,
        totalAmount: total,
        attendance: data.attendance, // Array of member _ids
        wagePerPerson: wage,
        recordedBy: userId
    });

    await record.save();

    await sendGroupNotification(
        await WorkGroup.findById(groupId),
        'Work Recorded',
        `Work recorded for ${data.date} at ${data.landOwnerName}'s Farm`,
        'WORK_RECORDED',
        null
    );

    return record;
};

export const getGroupWorkRecordsService = async (groupId) => {
    return await WorkRecord.find({ group: groupId }).sort({ date: -1 }).populate('recordedBy', 'name');
};

export const processSettlementService = async (groupId, data, userId) => {
    // Process records individually to support partial settlements
    const settledMemberIds = data.distributions.map(d => d.memberId.toString());
    
    const recordsToUpdate = await WorkRecord.find({ _id: { $in: data.workRecordsIncluded } });
    
    for (let record of recordsToUpdate) {
        // Add newly settled members who actually attended this record
        const attendeesToSettle = record.attendance
            .map(id => id.toString())
            .filter(id => settledMemberIds.includes(id));
            
        const newSettledMembers = new Set([
            ...(record.settledMembers || []).map(id => id.toString()),
            ...attendeesToSettle
        ]);
        
        record.settledMembers = Array.from(newSettledMembers);
        
        if (record.settledMembers.length === 0) {
            record.paymentStatus = 'PENDING';
        } else if (record.settledMembers.length >= record.attendance.length) {
            record.paymentStatus = 'SETTLED';
        } else {
            record.paymentStatus = 'PARTIAL';
        }
        
        await record.save();
    }

    const settlement = new Settlement({
        group: groupId,
        settlementType: data.settlementType, // 'GROUP_WIDE', 'SELECTED_MEMBERS', 'NET_SETTLEMENT'
        totalAmount: data.totalAmount,
        workRecordsIncluded: data.workRecordsIncluded,
        distributions: data.distributions,
        notes: data.notes,
        processedBy: userId
    });

    await settlement.save();

    await sendGroupNotification(
        await WorkGroup.findById(groupId),
        'Settlement Processed',
        `A settlement of ₹${data.totalAmount} has been processed`,
        'SETTLEMENT',
        null
    );

    return settlement;
};

export const getGroupAnalyticsService = async (groupId) => {
    const records = await WorkRecord.find({ group: groupId });
    
    let totalEarnings = 0;
    let pendingPayments = 0;
    let totalAcres = 0;
    let totalWorkDays = records.length;
    let memberStats = {}; // { memberId: { daysWorked: 0, earned: 0, pending: 0 } }

    records.forEach(r => {
        totalAcres += r.acres;
        totalEarnings += r.totalAmount;
        
        // Calculate pending payments based on members who haven't been settled yet
        const settledIds = (r.settledMembers || []).map(id => id.toString());
        const unsettledCount = r.attendance.length - settledIds.length;
        if (unsettledCount > 0) {
            pendingPayments += (unsettledCount * r.wagePerPerson);
        }

        r.attendance.forEach(memberId => {
            if (!memberStats[memberId]) {
                memberStats[memberId] = { daysWorked: 0, earned: 0, pending: 0 };
            }
            memberStats[memberId].daysWorked += 1;
            memberStats[memberId].earned += r.wagePerPerson;
            
            if (!settledIds.includes(memberId.toString())) {
                memberStats[memberId].pending += r.wagePerPerson;
            }
        });
    });

    return { totalEarnings, pendingPayments, totalAcres, totalWorkDays, memberStats };
};

export const getPersonalDashboardService = async (userId) => {
    // Find groups the user is a member of
    const groups = await WorkGroup.find({ 'members.user': userId });
    let totalEarned = 0;
    let pendingEarned = 0;
    let daysWorked = 0;

    for (let group of groups) {
        // Find member subdoc id
        const memberSubdoc = group.members.find(m => m.user && m.user.toString() === userId.toString());
        if (!memberSubdoc) continue;

        const records = await WorkRecord.find({ group: group._id, attendance: memberSubdoc._id });
        daysWorked += records.length;
        
        records.forEach(r => {
            totalEarned += r.wagePerPerson;
            const settledIds = (r.settledMembers || []).map(id => id.toString());
            if (!settledIds.includes(memberSubdoc._id.toString())) {
                pendingEarned += r.wagePerPerson;
            }
        });
    }

    return { totalEarned, pendingEarned, daysWorked, groupsCount: groups.length };
};
export const updateMemberRoleService = async (groupId, memberId, newRole, userId) => {
    const group = await WorkGroup.findById(groupId);
    if (!group) throw new Error("Group not found");
    
    // Check if requester is owner
    const member = group.members.id(memberId);
    if (!member) throw new Error("Member not found");
    
    member.role = newRole;
    
    // Manage admins array
    if (newRole === 'admin') {
        if (member.user && !group.admins.includes(member.user)) {
            group.admins.push(member.user);
        }
    } else {
        if (member.user) {
            group.admins = group.admins.filter(adminId => adminId.toString() !== member.user.toString());
        }
    }
    
    await group.save();

    if (member.user) {
        await sendNotification(
            member.user,
            'Role Updated',
            `Your role in ${group.name} is now ${newRole}`,
            'GROUP_PROMOTED',
            group._id
        );
    }

    return group;
};

export const removeGroupMemberService = async (groupId, memberId, userId) => {
    const group = await WorkGroup.findById(groupId);
    if (!group) throw new Error("Group not found");
    
    const member = group.members.id(memberId);
    if (!member) throw new Error("Member not found");
    
    member.status = 'removed';
    
    // Remove from admins if they were an admin
    if (member.user) {
        group.admins = group.admins.filter(adminId => adminId.toString() !== member.user.toString());
    }
    
    await group.save();

    if (member.user) {
        await sendNotification(
            member.user,
            'Removed from Group',
            `You have been removed from ${group.name}`,
            'GROUP_REMOVED',
            group._id
        );
    }

    return group;
};

export const transferOwnershipService = async (groupId, newOwnerId, userId) => {
    const group = await WorkGroup.findById(groupId);
    if (!group) throw new Error("Group not found");
    
    if (group.createdBy.toString() !== userId.toString()) {
        throw new Error("Only the current owner can transfer ownership");
    }
    
    group.createdBy = newOwnerId;
    
    // Find new owner in members and set role
    const newOwnerMember = group.members.find(m => m.user && m.user.toString() === newOwnerId.toString());
    if (newOwnerMember) {
        newOwnerMember.role = 'owner';
    }
    
    // Find old owner in members and set to admin or member
    const oldOwnerMember = group.members.find(m => m.user && m.user.toString() === userId.toString());
    if (oldOwnerMember) {
        oldOwnerMember.role = 'admin'; // Or member
    }
    
    return await group.save();
};

export const closeGroupService = async (groupId, userId) => {
    const group = await WorkGroup.findById(groupId);
    if (!group) throw new Error("Group not found");
    
    if (group.createdBy.toString() !== userId.toString()) {
        throw new Error("Only the owner can close the group");
    }
    
    group.status = 'closed';
    await group.save();

    await sendGroupNotification(
        group,
        'Group Closed',
        `${group.name} has been closed by the owner`,
        'GROUP_CLOSED',
        null
    );

    return group;
};
