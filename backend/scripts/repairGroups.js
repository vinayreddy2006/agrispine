import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WorkGroup from '../models/WorkGroup.js';
import User from '../models/User.js';

dotenv.config();

const repairGroups = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const groups = await WorkGroup.find({});
        console.log(`Found ${groups.length} groups to check.`);

        for (let group of groups) {
            let modified = false;

            // 1. Check Owner
            const ownerId = group.createdBy;
            if (ownerId) {
                const ownerInMembers = group.members.find(m => m.user && m.user.toString() === ownerId.toString());
                if (!ownerInMembers) {
                    console.log(`[Group ${group.name}] Owner ${ownerId} is missing from members. Adding...`);
                    const ownerUser = await User.findById(ownerId);
                    if (ownerUser) {
                        group.members.push({
                            user: ownerId,
                            name: ownerUser.name,
                            phone: ownerUser.phone,
                            isOffline: false,
                            role: 'owner',
                            status: 'active'
                        });
                        modified = true;
                    }
                } else if (ownerInMembers.role !== 'owner') {
                    console.log(`[Group ${group.name}] Owner ${ownerId} has wrong role ${ownerInMembers.role}. Fixing...`);
                    ownerInMembers.role = 'owner';
                    modified = true;
                }
            }

            // 2. Check Admins
            for (let adminId of group.admins) {
                if (adminId.toString() === ownerId?.toString()) continue; // Handled above
                
                const adminInMembers = group.members.find(m => m.user && m.user.toString() === adminId.toString());
                if (!adminInMembers) {
                    console.log(`[Group ${group.name}] Admin ${adminId} is missing from members. Adding...`);
                    const adminUser = await User.findById(adminId);
                    if (adminUser) {
                        group.members.push({
                            user: adminId,
                            name: adminUser.name,
                            phone: adminUser.phone,
                            isOffline: false,
                            role: 'admin',
                            status: 'active'
                        });
                        modified = true;
                    }
                } else if (adminInMembers.role !== 'admin' && adminInMembers.role !== 'owner') {
                    console.log(`[Group ${group.name}] Admin ${adminId} has wrong role ${adminInMembers.role}. Fixing...`);
                    adminInMembers.role = 'admin';
                    modified = true;
                }
            }

            if (modified) {
                await group.save();
                console.log(`[Group ${group.name}] Saved modifications.`);
            }
        }

        console.log('Repair complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error repairing groups:', error);
        process.exit(1);
    }
};

repairGroups();
