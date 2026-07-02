import { useState } from 'react';
import Swal from 'sweetalert2';
import api from '../utils/api';

export const useChatSelection = (messages, setMessages, socket, currentUser, t, loadMembers, setShowMessageInfo, setShowGroupInfo, setReplyingTo, conversationId) => {
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [selectionMenuOpen, setSelectionMenuOpen] = useState(false);
    const [activeMessageMenu, setActiveMessageMenu] = useState(null);

    const toggleSelection = (msgId) => {
        if (selectedMessages.includes(msgId)) {
            const newSelection = selectedMessages.filter(id => id !== msgId);
            setSelectedMessages(newSelection);
            if (newSelection.length === 0) setSelectionMode(false);
        } else {
            setSelectedMessages(prev => [...prev, msgId]);
        }
    };

    const startSelection = (msgId) => {
        setSelectionMode(true);
        setSelectedMessages([msgId]);
        setActiveMessageMenu(null);
    };

    const cancelSelection = () => {
        setSelectionMode(false);
        setSelectedMessages([]);
        setSelectionMenuOpen(false);
    };

    const handleReplySelected = () => {
        if (selectedMessages.length !== 1) return;
        const msg = messages.find(m => m._id === selectedMessages[0]);
        if (msg) setReplyingTo(msg);
        cancelSelection();
    };

    const handleInfoSelected = () => {
        if (selectedMessages.length !== 1) return;
        const msg = messages.find(m => m._id === selectedMessages[0]);
        if (msg) {
            loadMembers();
            setShowMessageInfo(msg);
            setShowGroupInfo(false);
        }
        cancelSelection();
    };

    const handleCopySelected = () => {
        const texts = selectedMessages.map(id => {
            const m = messages.find(msg => msg._id === id);
            return m?.text || "";
        }).filter(t => t).join("\n");

        if (texts) {
            navigator.clipboard.writeText(texts);
            Swal.fire({ toast: true, position: 'bottom', icon: 'success', title: t('village.copied', { defaultValue: 'Copied to clipboard' }), timer: 1500, showConfirmButton: false });
        }
        cancelSelection();
    };

    const handleBulkStar = async () => {
        const token = localStorage.getItem("token");
        for (const id of selectedMessages) {
            try {
                const { data } = await api.put(`/chat/star/${id}`, {}, { headers: { "auth-token": token } });
                socket.emit("update_message", { message: data, conversationId });
            } catch (err) { console.error(err); }
        }
        cancelSelection();
        Swal.fire({ toast: true, position: 'bottom', icon: 'success', title: t('village.starred', { defaultValue: 'Messages starred' }), timer: 1500, showConfirmButton: false });
    };

    const handleBulkDelete = async () => {
        if (selectedMessages.length === 0) return;
        const allMine = selectedMessages.every(id => {
            const msg = messages.find(m => m._id === id);
            return msg && msg.senderId === (currentUser.id || currentUser._id);
        });
        const swalOptions = { title: `${t('village.delete_cnt', { count: selectedMessages.length, defaultValue: `Delete ${selectedMessages.length} messages?` })}`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: t('village.delete_me', { defaultValue: 'Delete for me' }) };
        if (allMine) { swalOptions.showDenyButton = true; swalOptions.denyButtonText = t('village.delete_all', { defaultValue: 'Delete for Everyone' }); }
        const result = await Swal.fire(swalOptions);
        const token = localStorage.getItem("token");
        if (result.isConfirmed) {
            try { await api.put("/chat/delete-for-me", { messageIds: selectedMessages }, { headers: { "auth-token": token } }); setMessages(prev => prev.filter(m => !selectedMessages.includes(m._id))); cancelSelection(); } catch (err) { Swal.fire("Error", "Failed", "error"); }
        } else if (result.isDenied) {
            try { for (const id of selectedMessages) { const { data } = await api.delete(`/chat/delete/${id}`, { headers: { "auth-token": token } }); socket.emit("update_message", { message: data.message, conversationId }); } cancelSelection(); } catch (err) { Swal.fire("Error", "Failed", "error"); }
        }
    };

    const handleDeleteSingle = async (msg) => {
        setActiveMessageMenu(null);
        const isMe = msg.senderId === (currentUser.id || currentUser._id);
        if (msg.isDeleted) {
            const result = await Swal.fire({ title: t('village.delete_notif', { defaultValue: 'Delete notification?' }), icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: t('village.delete_me', { defaultValue: 'Delete for me' }) });
            if (result.isConfirmed) {
                const token = localStorage.getItem("token");
                await api.put("/chat/delete-for-me", { messageIds: [msg._id] }, { headers: { "auth-token": token } });
                setMessages(prev => prev.filter(m => m._id !== msg._id));
            }
            return;
        }
        const swalOptions = { title: t('village.delete_msg', { defaultValue: 'Delete Message?' }), icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: t('village.delete_me', { defaultValue: 'Delete for me' }) };
        if (isMe) { swalOptions.showDenyButton = true; swalOptions.denyButtonText = t('village.delete_all', { defaultValue: 'Delete for Everyone' }); }
        
        const result = await Swal.fire(swalOptions);
        const token = localStorage.getItem("token");
        if (result.isConfirmed) {
            try { await api.put("/chat/delete-for-me", { messageIds: [msg._id] }, { headers: { "auth-token": token } }); setMessages(prev => prev.filter(m => m._id !== msg._id)); } catch (err) { Swal.fire("Error", "Failed", "error"); }
        } else if (result.isDenied) {
            try { const { data } = await api.delete(`/chat/delete/${msg._id}`, { headers: { "auth-token": token } }); socket.emit("update_message", { message: data.message, conversationId }); } catch (err) { Swal.fire("Error", "Failed", "error"); }
        }
    };

    const starMessage = async (id) => {
        setActiveMessageMenu(null);
        try {
            const token = localStorage.getItem("token");
            const { data } = await api.put(`/chat/star/${id}`, {}, { headers: { "auth-token": token } });
            socket.emit("update_message", { message: data, conversationId });
        } catch (err) { console.error(err); }
    };

    return {
        selectionMode,
        selectedMessages,
        selectionMenuOpen,
        setSelectionMenuOpen,
        activeMessageMenu,
        setActiveMessageMenu,
        toggleSelection,
        startSelection,
        cancelSelection,
        handleReplySelected,
        handleInfoSelected,
        handleCopySelected,
        handleBulkStar,
        handleBulkDelete,
        handleDeleteSingle,
        starMessage,
        setSelectionMode
    };
};
