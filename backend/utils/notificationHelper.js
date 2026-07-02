import Notification from '../models/Notification.js';

export const sendNotification = async (userId, title, message, type = 'INFO', relatedId = null) => {
    try {
        if (!userId) return; // Ignore if no user (e.g., offline member)
        await Notification.create({
            user: userId,
            title,
            message,
            type,
            relatedId
        });
    } catch (error) {
        console.error('Error sending notification:', error);
    }
};

export const sendGroupNotification = async (group, title, message, type, excludeUserId = null) => {
    try {
        const notifyPromises = group.members
            .filter(member => member.user && member.user.toString() !== (excludeUserId || '').toString())
            .map(member => 
                Notification.create({
                    user: member.user,
                    title,
                    message,
                    type,
                    relatedId: group._id
                })
            );
        await Promise.all(notifyPromises);
    } catch (error) {
        console.error('Error sending group notification:', error);
    }
};
