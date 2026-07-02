import { useEffect } from 'react';
import api from '../utils/api';

export const useChatSocket = (conversationId, userId, setMessages, socketInstance) => {
    useEffect(() => {
        if (!conversationId || !socketInstance) return;

        // Join Conversation Room
        socketInstance.emit("join_conversation", { conversationId, userId });

        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem("token");
                const { data } = await api.get(`/chat/messages/${conversationId}`, { headers: { "auth-token": token } });
                setMessages(data);
            } catch (err) {
                console.error("Error fetching chat:", err);
            }
        };

        fetchHistory();

        // Socket Listeners
        const handleReceiveMessage = (data) => setMessages((list) => [...list, data]);
        const handleMessageDeleted = (id) => setMessages((list) => list.filter(m => m._id !== id));
        const handleBulkDelete = (ids) => setMessages((list) => list.filter(m => !ids.includes(m._id)));
        const handleMessageUpdated = (updatedMsg) => setMessages((list) => list.map(m => m._id === updatedMsg._id ? updatedMsg : m));
        const handleMessagesReadUpdate = () => fetchHistory();
        const handlePollUpdated = (updatedPoll) => setMessages((list) => list.map(m => (m.poll && m.poll._id === updatedPoll._id) ? { ...m, poll: updatedPoll } : m));

        socketInstance.on("receive_message", handleReceiveMessage);
        socketInstance.on("message_deleted", handleMessageDeleted);
        socketInstance.on("bulk_delete", handleBulkDelete);
        socketInstance.on("message_updated", handleMessageUpdated);
        socketInstance.on("messages_read_update", handleMessagesReadUpdate);
        socketInstance.on("poll_updated", handlePollUpdated);

        // Cleanup
        return () => {
            socketInstance.off("receive_message", handleReceiveMessage);
            socketInstance.off("message_deleted", handleMessageDeleted);
            socketInstance.off("bulk_delete", handleBulkDelete);
            socketInstance.off("message_updated", handleMessageUpdated);
            socketInstance.off("messages_read_update", handleMessagesReadUpdate);
            socketInstance.off("poll_updated", handlePollUpdated);
        };
    }, [conversationId, userId, setMessages, socketInstance]);
};
