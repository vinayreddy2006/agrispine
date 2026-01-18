import { useEffect, useState, useRef } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import EmojiPicker from "emoji-picker-react";
import {
    ArrowLeft, Send, MoreVertical, X, Phone, User,
    Paperclip, Mic, Smile, Search, Trash2, Star, Reply,
    CheckCheck, Check, BarChart2, Pin, CheckSquare, ChevronDown, Plus, LogOut, Ban,
    Image as ImageIcon, Upload, StopCircle, Download, Forward, Copy, Info, Share2
} from "lucide-react";
import Swal from "sweetalert2";

const socket = io.connect("http://localhost:5000");

// 🌾 AGRICULTURE THEME LIBRARY
const AGRI_THEMES = [
    { id: 'default', name: 'Default Green', url: 'https://www.transparenttextures.com/patterns/cubes.png', color: '#e5ddd5' },
    { id: 'wheat', name: 'Golden Wheat', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1600&auto=format&fit=crop', color: '#f0e6d2' },
    { id: 'rice', name: 'Green Paddy', url: 'https://images.unsplash.com/photo-1536617621572-1d5f1e6269a0?q=80&w=1600&auto=format&fit=crop', color: '#dcfce7' },
    { id: 'tractor', name: 'Tractor', url: 'https://images.unsplash.com/photo-1515573760453-272e5055b31e?q=80&w=1600&auto=format&fit=crop', color: '#e0f2fe' },
    { id: 'soil', name: 'Rich Soil', url: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1600&auto=format&fit=crop', color: '#f3e8ff' },
    { id: 'cotton', name: 'Cotton Field', url: 'https://images.unsplash.com/photo-1595123550441-d377e017de6a?q=80&w=1600&auto=format&fit=crop', color: '#f8fafc' },
    { id: 'corn', name: 'Corn Maize', url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?q=80&w=1600&auto=format&fit=crop', color: '#fef3c7' },
    { id: 'sunflower', name: 'Sunflowers', url: 'https://images.unsplash.com/photo-1470509037663-253afd7f0f51?q=80&w=1600&auto=format&fit=crop', color: '#fef9c3' },
    { id: 'rain', name: 'Monsoon', url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1600&auto=format&fit=crop', color: '#e0f2fe' },
    { id: 'cows', name: 'Livestock', url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=1600&auto=format&fit=crop', color: '#fae8ff' },
    { id: 'veggies', name: 'Vegetables', url: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?q=80&w=1600&auto=format&fit=crop', color: '#dcfce7' },
    { id: 'orchard', name: 'Fruit Orchard', url: 'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?q=80&w=1600&auto=format&fit=crop', color: '#fee2e2' }
];

const VillageChat = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState("");
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // UI States
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [showMessageInfo, setShowMessageInfo] = useState(null); // For "Info" screen
    const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
    const [selectionMenuOpen, setSelectionMenuOpen] = useState(false);

    // Search States
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Menu & Feature States
    const [activeMessageMenu, setActiveMessageMenu] = useState(null);
    const [showReactionPicker, setShowReactionPicker] = useState(null);
    const [showInputEmoji, setShowInputEmoji] = useState(false);
    const [viewImage, setViewImage] = useState(null);

    const [replyingTo, setReplyingTo] = useState(null);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState([]);

    // File Upload States
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Voice Recording States
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const timerRef = useRef(null);

    // Data States
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [showThemeModal, setShowThemeModal] = useState(false);
    const [chatBackground, setChatBackground] = useState(AGRI_THEMES[0]);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (!userStr) { navigate("/login"); return; }

        const user = JSON.parse(userStr);
        setCurrentUser(user);
        const villageName = user.village;

        // NOTE: Sending userId to backend so it marks messages as read
        if (villageName) socket.emit("join_village", { village: villageName, userId: user.id || user._id });

        const savedTheme = localStorage.getItem("chat_theme");
        if (savedTheme) {
            try { setChatBackground(JSON.parse(savedTheme)); } catch (e) { console.error("Error parsing theme"); }
        }

        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem("token");
                const { data } = await api.get(`/chat/${villageName}`, { headers: { "auth-token": token } });
                setMessages(data);
            } catch (err) { console.error("Error fetching chat"); }
        };

        const fetchMembers = async () => {
            try {
                const token = localStorage.getItem("token");
                const { data } = await api.get(`/auth/members/${villageName}`, { headers: { "auth-token": token } });
                setMembers(data);
            } catch (err) { console.error("Failed to load members"); }
        };

        fetchHistory();
        fetchMembers();

        socket.on("receive_message", (data) => {
            // When receiving, assume it's unread initially, but since I'm here, I read it.
            // In a real app, you'd emit 'read' here. For now, we append.
            setMessages((list) => [...list, data]);
        });

        socket.on("message_deleted", (id) => setMessages((list) => list.filter(m => m._id !== id)));
        socket.on("bulk_delete", (ids) => setMessages((list) => list.filter(m => !ids.includes(m._id))));
        socket.on("message_updated", (updatedMsg) => setMessages((list) => list.map(m => m._id === updatedMsg._id ? updatedMsg : m)));

        // Listen for read receipts update
        socket.on("messages_read_update", () => {
            // In a simple app, we might just refetch or optimistically update. 
            // For simplicity here, we reload history to get new 'readBy' arrays
            fetchHistory();
        });

        return () => {
            socket.off("receive_message");
            socket.off("message_deleted");
            socket.off("bulk_delete");
            socket.off("message_updated");
            socket.off("messages_read_update");
        };
    }, [navigate]);

    useEffect(() => {
        if (!selectionMode && !isSearching) {
            const timer = setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [messages, selectionMode, isSearching]);

    // --- SEARCH HIGHLIGHTER ---
    const HighlightText = ({ text, highlight }) => {
        if (!highlight.trim()) return <span>{text}</span>;
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === highlight.toLowerCase() ?
                        <span key={i} className="bg-yellow-200 text-gray-900">{part}</span> : part
                )}
            </span>
        );
    };

    // --- DATE HELPERS ---
    const getMessageDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
        return date.toLocaleDateString();
    };

    const groupMessagesByDate = (msgs) => {
        const filtered = isSearching
            ? msgs.filter(m => m.text && m.text.toLowerCase().includes(searchQuery.toLowerCase()))
            : msgs;

        const groups = {};
        filtered.forEach(msg => {
            const date = getMessageDate(msg.createdAt);
            if (!groups[date]) groups[date] = [];
            groups[date].push(msg);
        });
        return groups;
    };

    // --- VOICE RECORDING LOGIC ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            Swal.fire("Error", "Microphone access denied", "error");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        clearInterval(timerRef.current);
    };

    const cancelRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        clearInterval(timerRef.current);
        setIsRecording(false);
        setAudioBlob(null);
        setRecordingTime(0);
    };

    const sendAudioMessage = async () => {
        if (!audioBlob) return;
        setIsUploading(true);

        const formData = new FormData();
        formData.append("image", audioBlob, "voice-note.webm");

        try {
            const token = localStorage.getItem("token");
            const { data } = await api.post("/chat/upload", formData, {
                headers: { "auth-token": token, "Content-Type": "multipart/form-data" }
            });

            const messageData = {
                senderId: currentUser.id || currentUser._id,
                senderName: currentUser.name,
                senderImage: currentUser.profileImage,
                village: currentUser.village,
                text: "",
                audio: data.imageUrl,
                createdAt: new Date(),
            };

            await socket.emit("send_message", messageData);
            cancelRecording();
        } catch (err) {
            Swal.fire("Error", "Failed to send audio", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // --- HELPERS ---
    const loadMembers = async () => {
        if (members.length > 0) return;
        setLoadingMembers(true);
        try {
            const token = localStorage.getItem("token");
            const { data } = await api.get(`/auth/members/${currentUser.village}`, { headers: { "auth-token": token } });
            setMembers(data);
        } catch (err) { console.error("Failed"); } finally { setLoadingMembers(false); }
    };

    const toggleGroupInfo = () => {
        setShowGroupInfo(!showGroupInfo);
        if (showMessageInfo) setShowMessageInfo(null);
        if (!showGroupInfo) loadMembers();
    };

    const handleLogout = () => {
        Swal.fire({ title: 'Log out?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Log out' }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
            }
        });
    };

    const handleThemeSelect = (theme) => {
        setChatBackground(theme);
        localStorage.setItem("chat_theme", JSON.stringify(theme));
        setShowThemeModal(false);
        setHeaderMenuOpen(false);
    };

    const handleCustomUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const customTheme = { id: 'custom', name: 'Custom Image', url: reader.result, color: '#f0f0f0' };
                handleThemeSelect(customTheme);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => { setImagePreview(reader.result); };
            reader.readAsDataURL(file);
        }
    };

    const clearAttachment = () => {
        setSelectedFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const downloadImage = (imageUrl, filename) => {
        fetch(imageUrl)
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = filename || 'download.jpg';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch(() => window.open(imageUrl, '_blank'));
    };

    // --- SELECTION & BULK ACTIONS ---
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
            setShowGroupInfo(false); // Ensure group info is closed
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
            Swal.fire({ toast: true, position: 'bottom', icon: 'success', title: 'Copied to clipboard', timer: 1500, showConfirmButton: false });
        }
        cancelSelection();
    };

    const handleBulkStar = async () => {
        const token = localStorage.getItem("token");
        for (const id of selectedMessages) {
            try {
                const { data } = await api.put(`/chat/star/${id}`, {}, { headers: { "auth-token": token } });
                socket.emit("update_message", { message: data, village: currentUser.village });
            } catch (err) { console.error(err); }
        }
        cancelSelection();
        Swal.fire({ toast: true, position: 'bottom', icon: 'success', title: 'Messages starred', timer: 1500, showConfirmButton: false });
    };

    const handleBulkDelete = async () => {
        if (selectedMessages.length === 0) return;
        const allMine = selectedMessages.every(id => {
            const msg = messages.find(m => m._id === id);
            return msg && msg.senderId === (currentUser.id || currentUser._id);
        });
        const swalOptions = { title: `Delete ${selectedMessages.length} messages?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Delete for me' };
        if (allMine) { swalOptions.showDenyButton = true; swalOptions.denyButtonText = 'Delete for Everyone'; }
        const result = await Swal.fire(swalOptions);
        const token = localStorage.getItem("token");
        if (result.isConfirmed) {
            try { await api.put("/chat/delete-for-me", { messageIds: selectedMessages }, { headers: { "auth-token": token } }); setMessages(prev => prev.filter(m => !selectedMessages.includes(m._id))); cancelSelection(); } catch (err) { Swal.fire("Error", "Failed", "error"); }
        } else if (result.isDenied) {
            try { for (const id of selectedMessages) { const { data } = await api.delete(`/chat/delete/${id}`, { headers: { "auth-token": token } }); socket.emit("update_message", { message: data.message, village: currentUser.village }); } cancelSelection(); } catch (err) { Swal.fire("Error", "Failed", "error"); }
        }
    };

    const handleDeleteSingle = async (msg) => {
        setActiveMessageMenu(null);
        const isMe = msg.senderId === (currentUser.id || currentUser._id);
        if (msg.isDeleted) {
            const result = await Swal.fire({ title: 'Delete notification?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Delete for me' });
            if (result.isConfirmed) {
                const token = localStorage.getItem("token");
                await api.put("/chat/delete-for-me", { messageIds: [msg._id] }, { headers: { "auth-token": token } });
                setMessages(prev => prev.filter(m => m._id !== msg._id));
            }
            return;
        }
        const swalOptions = { title: 'Delete Message?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Delete for me' };
        if (isMe) { swalOptions.showDenyButton = true; swalOptions.denyButtonText = 'Delete for Everyone'; }
        const result = await Swal.fire(swalOptions);
        const token = localStorage.getItem("token");
        if (result.isConfirmed) {
            try { await api.put("/chat/delete-for-me", { messageIds: [msg._id] }, { headers: { "auth-token": token } }); setMessages(prev => prev.filter(m => m._id !== msg._id)); } catch (err) { Swal.fire("Error", "Failed", "error"); }
        } else if (result.isDenied) {
            try { const { data } = await api.delete(`/chat/delete/${msg._id}`, { headers: { "auth-token": token } }); socket.emit("update_message", { message: data.message, village: currentUser.village }); } catch (err) { Swal.fire("Error", "Failed", "error"); }
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (currentMessage.trim() === "" && !selectedFile) return;
        setIsUploading(true);
        let imageUrl = "";
        if (selectedFile) {
            const formData = new FormData();
            formData.append("image", selectedFile);
            try {
                const token = localStorage.getItem("token");
                const { data } = await api.post("/chat/upload", formData, { headers: { "auth-token": token, "Content-Type": "multipart/form-data" } });
                imageUrl = data.imageUrl;
            } catch (err) { Swal.fire("Error", "Image upload failed", "error"); setIsUploading(false); return; }
        }
        const messageData = { senderId: currentUser.id || currentUser._id, senderName: currentUser.name, senderImage: currentUser.profileImage, village: currentUser.village, text: currentMessage, image: imageUrl, replyTo: replyingTo ? replyingTo._id : null, replyText: replyingTo ? replyingTo.text : "", createdAt: new Date() };
        await socket.emit("send_message", messageData);
        setCurrentMessage(""); clearAttachment(); setReplyingTo(null); setShowInputEmoji(false); setIsUploading(false);
    };

    const reactToMessage = async (msgId, emoji) => { try { const token = localStorage.getItem("token"); const { data } = await api.put(`/chat/react/${msgId}`, { emoji }, { headers: { "auth-token": token } }); socket.emit("update_message", { message: data, village: currentUser.village }); } catch (err) { console.error(err); } setActiveMessageMenu(null); setShowReactionPicker(null); };
    const removeReaction = async (msgId) => { try { const token = localStorage.getItem("token"); const { data } = await api.put(`/chat/react/remove/${msgId}`, {}, { headers: { "auth-token": token } }); socket.emit("update_message", { message: data, village: currentUser.village }); Swal.fire({ toast: true, position: 'bottom', icon: 'success', title: 'Reaction removed', timer: 1000, showConfirmButton: false }); } catch (err) { console.error(err); } };
    const starMessage = async (msgId) => { try { const token = localStorage.getItem("token"); const { data } = await api.put(`/chat/star/${msgId}`, {}, { headers: { "auth-token": token } }); socket.emit("update_message", { message: data, village: currentUser.village }); } catch (err) { console.error(err); } setActiveMessageMenu(null); };
    const clearChat = async () => { const result = await Swal.fire({ title: "Clear Chat?", text: "Delete all messages?", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "Yes" }); if (result.isConfirmed) { try { const token = localStorage.getItem("token"); await api.delete(`/chat/clear/${currentUser.village}`, { headers: { "auth-token": token } }); window.location.reload(); } catch (err) { Swal.fire("Error", "Failed", "error"); } } setHeaderMenuOpen(false); };
    const handleAttach = () => { fileInputRef.current.click(); };
    const getUserColor = (name) => { const colors = ["text-red-500", "text-orange-500", "text-purple-500", "text-blue-500", "text-pink-600", "text-teal-600"]; let sum = 0; for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i); return colors[sum % colors.length]; };
    const getSenderImage = (msg) => { if (msg.senderImage) return msg.senderImage; const member = members.find(m => m._id === msg.senderId); return member ? member.profileImage : null; };

    // --- BLUE TICK LOGIC ---
    const getTickStatus = (msg) => {
        // 1. Sent (Single Grey)
        // 2. Delivered (Double Grey) - Simplified as "Saved"
        // 3. Read (Double Blue) - Read by all other members

        // Exclude sender from count
        const totalMembers = members.length;
        const readCount = msg.readBy ? msg.readBy.length : 0;

        // If read by everyone else (total - 1 sender)
        const isReadByAll = readCount >= (totalMembers - 1);

        if (isReadByAll) return <CheckCheck className="w-3 h-3 text-blue-500" />;
        return <CheckCheck className="w-3 h-3 text-gray-400" />; // Double Gray (Delivered)
    };

    const groupedMessages = groupMessagesByDate(messages);

    return (
        <div className="fixed inset-0 z-50 w-full h-[100dvh] bg-gray-100 flex overflow-hidden">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />

            {/* LEFT SIDE: CHAT AREA */}
            <div className="flex-1 flex flex-col relative border-r border-gray-300 h-full w-full bg-gray-100">
                <div className="absolute inset-0 z-0 bg-cover bg-center opacity-60 pointer-events-none" style={{ backgroundImage: `url('${chatBackground.url}')`, backgroundColor: chatBackground.color || '#e5ddd5' }} />

                {/* Header Logic */}
                {isSearching ? (
                    <div className="bg-white px-4 py-3 flex items-center gap-3 shadow-md z-20 shrink-0 h-[64px] animate-in slide-in-from-top-2">
                        <button onClick={() => { setIsSearching(false); setSearchQuery(""); }} className="p-1 hover:bg-gray-100 rounded-full text-gray-600"><ArrowLeft className="w-6 h-6" /></button>
                        <input type="text" autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search messages..." className="flex-1 outline-none text-gray-700 bg-transparent text-sm" />
                        {searchQuery && <button onClick={() => setSearchQuery("")} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>}
                    </div>
                ) : !selectionMode ? (
                    <div className="bg-[#008069] px-4 py-3 flex items-center justify-between text-white shadow-md z-20 shrink-0 relative">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={toggleGroupInfo}>
                            <button onClick={(e) => { e.stopPropagation(); navigate("/dashboard"); }} className="p-1 hover:bg-white/20 rounded-full"><ArrowLeft className="w-6 h-6" /></button>
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">{currentUser?.village?.charAt(0) || "V"}</div>
                            <div className="overflow-hidden"><h1 className="font-bold text-lg leading-tight truncate max-w-[180px] md:max-w-xs">{currentUser?.village || "Village"}</h1><p className="text-xs text-green-100 hover:underline truncate">click for info</p></div>
                        </div>
                        <div className="flex items-center gap-3 md:gap-4 relative">
                            <Search className="w-5 h-5 cursor-pointer hover:opacity-80" onClick={() => setIsSearching(true)} />
                            <div className="relative">
                                <MoreVertical className="w-5 h-5 cursor-pointer hover:opacity-80" onClick={() => setHeaderMenuOpen(!headerMenuOpen)} />
                                {headerMenuOpen && (
                                    <div className="absolute right-0 top-8 w-48 bg-white text-gray-800 rounded-lg shadow-xl py-2 z-50 border border-gray-100 animate-in fade-in zoom-in-95">
                                        <button className="w-full text-left px-4 py-3 hover:bg-gray-100 text-sm" onClick={() => { toggleGroupInfo(); setHeaderMenuOpen(false); }}>Group Info</button>
                                        <button className="w-full text-left px-4 py-3 hover:bg-gray-100 text-sm flex items-center gap-2" onClick={() => { setSelectionMode(true); setHeaderMenuOpen(false); }}><CheckSquare className="w-3 h-3" /> Select Messages</button>
                                        <button className="w-full text-left px-4 py-3 hover:bg-gray-100 text-sm flex items-center gap-2" onClick={() => { setShowThemeModal(true); setHeaderMenuOpen(false); }}><ImageIcon className="w-3 h-3" /> Change Theme</button>
                                        <button className="w-full text-left px-4 py-3 hover:bg-gray-100 text-sm text-red-600" onClick={clearChat}>Clear Chat</button>
                                        <button className="w-full text-left px-4 py-3 hover:bg-gray-100 text-sm text-red-600 border-t border-gray-100 flex items-center gap-2" onClick={handleLogout}><LogOut className="w-3 h-3" /> Log out</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#008069] px-4 py-3 flex items-center justify-between text-white shadow-md z-20 shrink-0 relative animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-4">
                            <button onClick={cancelSelection} className="p-1 hover:bg-white/20 rounded-full"><X className="w-6 h-6" /></button>
                            <span className="font-bold text-lg">{selectedMessages.length} Selected</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {selectedMessages.length === 1 && <button onClick={handleReplySelected} className="p-2 hover:bg-white/20 rounded-full" title="Reply"><Reply className="w-5 h-5" /></button>}
                            <button onClick={handleBulkStar} className="p-2 hover:bg-white/20 rounded-full" title="Star"><Star className="w-5 h-5" /></button>
                            <button onClick={handleBulkDelete} className="p-2 hover:bg-white/20 rounded-full" title="Delete"><Trash2 className="w-5 h-5" /></button>
                            <div className="relative">
                                <button onClick={() => setSelectionMenuOpen(!selectionMenuOpen)} className="p-2 hover:bg-white/20 rounded-full" title="More"><MoreVertical className="w-5 h-5" /></button>
                                {selectionMenuOpen && (
                                    <div className="absolute right-0 top-10 w-48 bg-white text-gray-800 rounded-lg shadow-xl py-2 z-50 border border-gray-100 animate-in fade-in zoom-in-95">
                                        <button className="w-full text-left px-4 py-3 hover:bg-gray-100 text-sm flex items-center gap-2"><Forward className="w-4 h-4" /> Forward</button>
                                        <button className="w-full text-left px-4 py-3 hover:bg-gray-100 text-sm flex items-center gap-2" onClick={handleCopySelected}><Copy className="w-4 h-4" /> Copy</button>
                                        {selectedMessages.length === 1 && <button className="w-full text-left px-4 py-3 hover:bg-gray-100 text-sm flex items-center gap-2" onClick={handleInfoSelected}><Info className="w-4 h-4" /> Info</button>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Chat Body */}
                <div className="flex-1 overflow-y-auto px-2 md:px-4 pt-4 pb-2 space-y-1 relative z-10" onClick={() => { setHeaderMenuOpen(false); setActiveMessageMenu(null); setShowInputEmoji(false); setShowReactionPicker(null); setSelectionMenuOpen(false); }}>
                    {Object.keys(groupedMessages).map((date) => (
                        <div key={date}>
                            <div className="sticky top-2 z-30 flex justify-center mb-4 pointer-events-none"><span className="bg-white/90 text-gray-600 text-xs font-medium px-3 py-1 rounded-full shadow-sm border border-gray-100 backdrop-blur-[2px]">{date}</span></div>
                            {groupedMessages[date].map((msg, index) => {
                                const isMe = msg.senderId === (currentUser.id || currentUser._id);
                                const isStarred = msg.starredBy?.includes(currentUser.id || currentUser._id);
                                const profileImg = getSenderImage(msg);
                                const isSelected = selectedMessages.includes(msg._id);
                                const isDeleted = msg.isDeleted;
                                const flatIndex = messages.findIndex(m => m._id === msg._id);
                                const isNearBottom = flatIndex > messages.length - 3;

                                return (
                                    <div key={msg._id || index} className={`flex w-full mb-1 gap-1.5 transition-colors ${isSelected ? "bg-blue-100/50 -mx-4 px-4 py-1" : ""} ${selectionMode ? "cursor-pointer hover:bg-black/5" : ""} ${isMe ? "justify-end" : "justify-start"}`} onClick={() => selectionMode && toggleSelection(msg._id)}>
                                        {selectionMode && <div className="self-center mr-1"><div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition ${isSelected ? "bg-[#008069] border-[#008069]" : "border-gray-400 bg-white"}`}>{isSelected && <Check className="w-3 h-3 text-white" />}</div></div>}
                                        {!isMe && <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-[10px] shrink-0 mt-1 overflow-hidden shadow-sm">{profileImg ? <img src={profileImg} className="w-full h-full object-cover" /> : (msg.senderName ? msg.senderName[0].toUpperCase() : "U")}</div>}
                                        <div className={`flex items-start gap-1 max-w-[85%] md:max-w-[70%] group relative ${isMe ? "flex-row-reverse" : "flex-row"}`} onClick={() => selectionMode && toggleSelection(msg._id)}>
                                            <div className={`rounded-lg shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative w-fit break-all flex flex-col 
    ${isMe ? "bg-[#d9fdd3] text-gray-900 rounded-tr-none" : "bg-white text-gray-900 rounded-tl-none"}
    ${!msg.text && msg.image ? "p-1" : "px-2 pt-1 pb-1.5"}`}
                                            >
                                                {!isMe && <p className={`text-[10px] font-bold leading-tight mb-0.5 px-1 cursor-pointer hover:underline ${getUserColor(msg.senderName)}`}>~ {msg.senderName}</p>}

                                                {isDeleted ? (
                                                    <div className="flex flex-col px-2 pb-1">
                                                        <div className="flex items-center gap-1.5 text-gray-500 italic text-sm py-1 pr-2">
                                                            <Ban className="w-3.5 h-3.5" />
                                                            <span>{isMe ? "You deleted this message" : "This message was deleted"}</span>
                                                        </div>
                                                        <div className="flex items-center justify-end gap-0.5 ml-auto opacity-60 h-3 mb-[1px]">
                                                            <span className="text-[9px] whitespace-nowrap">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* 🖼️ IMAGE DISPLAY */}
                                                        {msg.image && (
                                                            <div className="relative rounded-lg overflow-hidden cursor-pointer mb-1" onClick={() => setViewImage(msg)}>
                                                                <img
                                                                    src={msg.image}
                                                                    alt="attachment"
                                                                    className="w-full h-auto max-w-[280px] max-h-[300px] object-cover"
                                                                />

                                                                {/* OVERLAY: Only if NO text (Star + Time on Image) */}
                                                                {!msg.text && (
                                                                    <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-black/60 to-transparent p-1 pt-6 flex justify-end items-end gap-1">
                                                                        {isStarred && <Star className="w-3 h-3 text-white fill-white" />}
                                                                        <span className="text-[10px] text-white/90 font-medium">
                                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                        {isMe && <span className="text-white/90">{getTickStatus(msg)}</span>}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* 🎵 AUDIO PLAYER */}
                                                        {msg.audio && (
                                                            <div className="mb-1 w-[200px] md:w-[250px] relative">
                                                                <audio controls src={msg.audio} className="w-full h-8" />
                                                                {/* Star + Time for Audio Only */}
                                                                {!msg.text && (
                                                                    <div className="flex justify-end items-center gap-1 mt-1 mr-1">
                                                                        {isStarred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                                                        <span className="text-[9px] text-gray-500">
                                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                        {isMe && getTickStatus(msg)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* 💬 REPLY QUOTE */}
                                                        {msg.replyText && (
                                                            <div className="bg-black/5 border-l-4 border-green-600 p-1 mb-1 rounded text-[10px] text-gray-600 truncate opacity-80 mx-1">
                                                                {msg.replyText}
                                                            </div>
                                                        )}

                                                        {/* 📝 TEXT CONTENT (Caption or Message) */}
                                                        {msg.text && (
                                                            <div className="flex flex-wrap gap-x-2 items-end align-bottom px-1">
                                                                <p className="text-sm leading-snug whitespace-pre-wrap break-words">
                                                                    <HighlightText text={msg.text} highlight={searchQuery} />
                                                                </p>
                                                                <div className="flex items-center gap-0.5 ml-auto opacity-60 h-3 mb-[1px]">
                                                                    {isStarred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                                                    <span className="text-[9px] whitespace-nowrap">
                                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                    {isMe && getTickStatus(msg)}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* ❤️ REACTIONS */}
                                                        {msg.reactions && msg.reactions.length > 0 && (
                                                            <div className="absolute -bottom-2 right-0 bg-white shadow-sm rounded-full px-1.5 py-0.5 flex gap-0.5 border border-gray-100 text-[10px] z-10">
                                                                {msg.reactions.map((r, i) => {
                                                                    const isMyReaction = r.user === (currentUser.id || currentUser._id);
                                                                    return (
                                                                        <span key={i} className={`cursor-pointer hover:scale-125 transition ${isMyReaction ? "bg-blue-100 rounded px-0.5" : ""}`} onClick={(e) => { e.stopPropagation(); if (isMyReaction) { Swal.fire({ title: 'Remove reaction?', icon: 'question', showCancelButton: true, confirmButtonText: 'Remove', confirmButtonColor: '#d33', heightAuto: false, width: '300px' }).then((res) => { if (res.isConfirmed) removeReaction(msg._id); }); } }}>{r.emoji}</span>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {!selectionMode && !isDeleted && (
                                                <div className={`flex flex-col gap-1 self-center opacity-0 group-hover:opacity-100 transition duration-200 ${isMe ? 'mr-1' : 'ml-1'}`}>
                                                    <button className="p-1 rounded-full bg-white shadow-sm hover:bg-gray-100 text-gray-500" onClick={(e) => { e.stopPropagation(); setShowReactionPicker(msg._id); setActiveMessageMenu(null); }}><Smile className="w-3.5 h-3.5" /></button>
                                                    <button className="p-1 rounded-full bg-white shadow-sm hover:bg-gray-100 text-gray-500" onClick={(e) => { e.stopPropagation(); setActiveMessageMenu(activeMessageMenu === msg._id ? null : msg._id); setShowReactionPicker(null); }}><ChevronDown className="w-3.5 h-3.5" /></button>
                                                </div>
                                            )}

                                            {showReactionPicker === msg._id && (
                                                <div className={`absolute z-50 shadow-2xl ${isNearBottom ? 'bottom-8' : 'top-8'} ${isMe ? 'right-10' : 'left-10'} animate-in fade-in zoom-in-95`}>
                                                    <EmojiPicker onEmojiClick={(e) => reactToMessage(msg._id, e.emoji)} width={280} height={300} searchDisabled />
                                                </div>
                                            )}

                                            {activeMessageMenu === msg._id && (
                                                <div className={`absolute z-50 w-56 bg-white rounded-lg shadow-2xl py-2 border border-gray-100 
        ${isNearBottom ? 'bottom-8 origin-bottom' : 'top-8 origin-top'} 
        ${isMe ? 'right-0 md:right-full md:mr-2' : 'left-0 md:left-full md:ml-2'} 
        animate-in fade-in zoom-in-95 duration-100`}
                                                >
                                                    {!isDeleted ? (
                                                        <>
                                                            <button onClick={() => { setReplyingTo(msg); setActiveMessageMenu(null); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 text-xs flex items-center gap-3 text-gray-700">
                                                                <Reply className="w-4 h-4" /> Reply
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setShowMessageInfo(msg);
                                                                    loadMembers();
                                                                    setShowGroupInfo(false);
                                                                    setActiveMessageMenu(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 text-xs flex items-center gap-3 text-gray-700"
                                                            >
                                                                <Info className="w-4 h-4" /> Info
                                                            </button>

                                                            <button onClick={() => starMessage(msg._id)} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 text-xs flex items-center gap-3 text-gray-700">
                                                                <Star className={`w-4 h-4 ${isStarred ? 'text-yellow-500 fill-yellow-500' : ''}`} /> {isStarred ? 'Unstar' : 'Star'}
                                                            </button>

                                                            <button onClick={() => startSelection(msg._id)} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 text-xs flex items-center gap-3 text-gray-700">
                                                                <CheckSquare className="w-4 h-4" /> Select Message
                                                            </button>

                                                            <button onClick={() => handleDeleteSingle(msg)} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 text-xs text-red-600 flex items-center gap-3 border-t border-gray-100">
                                                                <Trash2 className="w-4 h-4" /> Delete
                                                            </button>

                                                            <div className="flex justify-between px-4 py-2 border-t bg-gray-50 gap-1 relative">
                                                                {['👍', '❤️', '😂', '🙏', '😮'].map(emoji => (
                                                                    <span key={emoji} onClick={() => reactToMessage(msg._id, emoji)} className="cursor-pointer hover:scale-125 transition text-lg">{emoji}</span>
                                                                ))}
                                                                <button onClick={(e) => { e.stopPropagation(); setShowReactionPicker(msg._id); }} className="bg-gray-200 hover:bg-gray-300 rounded-full p-1">
                                                                    <Plus className="w-3.5 h-3.5 text-gray-600" />
                                                                </button>
                                                                {showReactionPicker === msg._id && (
                                                                    <div className="absolute top-10 right-0 z-50 shadow-2xl">
                                                                        <EmojiPicker onEmojiClick={(e) => reactToMessage(msg._id, e.emoji)} width={280} height={300} searchDisabled />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <button onClick={() => handleDeleteSingle(msg)} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 text-xs text-gray-700 flex items-center gap-3">
                                                            <Trash2 className="w-4 h-4" /> Delete for me
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                    <div ref={messagesEndRef} className="pt-2" />
                </div>

                {/* Input Area */}
                {!selectionMode && (
                    <div className="bg-[#f0f2f5] px-2 md:px-4 py-2 z-20 shrink-0 pb-safe relative shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
                        {imagePreview && (
                            <div className="bg-white p-2 mb-2 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between animate-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 border border-gray-200"><img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /></div><div className="flex flex-col"><span className="text-xs font-bold text-gray-700">Photo selected</span><span className="text-[10px] text-gray-500">Add a caption...</span></div></div>
                                <button onClick={clearAttachment} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition"><X className="w-5 h-5" /></button>
                            </div>
                        )}
                        {showInputEmoji && <div className="absolute bottom-16 left-2 z-50 shadow-2xl rounded-lg overflow-hidden"><EmojiPicker onEmojiClick={(e) => setCurrentMessage(prev => prev + e.emoji)} width={300} height={350} /></div>}
                        {replyingTo && <div className="bg-white px-4 py-2 border-l-4 border-green-600 flex justify-between items-center mb-2 rounded-lg shadow-sm"><div className="text-sm overflow-hidden"><p className="text-green-700 font-bold text-xs">Replying to {replyingTo.senderName}</p><p className="text-gray-500 truncate text-xs">{replyingTo.text}</p></div><button onClick={() => setReplyingTo(null)}><X className="w-4 h-4 text-gray-500" /></button></div>}

                        <div className="flex items-center gap-2">
                            {isRecording ? (
                                <div className="flex-1 flex items-center gap-3 bg-red-50 border border-red-100 rounded-full px-4 py-2.5 animate-in fade-in duration-200 shadow-inner">
                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                    <span className="text-red-600 text-sm font-mono font-medium flex-1">Recording {formatTime(recordingTime)}</span>
                                    <button onClick={cancelRecording} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition" title="Cancel"><Trash2 className="w-5 h-5" /></button>
                                    <button onClick={() => { stopRecording(); setTimeout(sendAudioMessage, 500); }} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition active:scale-95" title="Send Audio"><Send className="w-5 h-5 ml-0.5" /></button>
                                </div>
                            ) : (
                                <>
                                    <button type="button" onClick={() => setShowInputEmoji(!showInputEmoji)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition"><Smile className="w-6 h-6" /></button>
                                    <button type="button" onClick={handleAttach} className={`p-2 rounded-full transition ${imagePreview ? 'text-green-600 bg-green-50' : 'text-gray-500 hover:bg-gray-200'}`}><Paperclip className="w-5 h-5 md:w-6 md:h-6" /></button>
                                    <form onSubmit={sendMessage} className="flex-1"><input type="text" value={currentMessage} placeholder={imagePreview ? "Add a caption..." : "Message"} className="w-full bg-white border border-gray-200 rounded-full md:rounded-lg px-4 py-2 md:py-3 outline-none focus:ring-1 focus:ring-[#008069] text-gray-700 text-sm" onChange={(event) => setCurrentMessage(event.target.value)} onFocus={() => setShowInputEmoji(false)} /></form>
                                    {(currentMessage.trim() || imagePreview) ? (
                                        <button onClick={sendMessage} disabled={isUploading} className={`p-3 bg-[#008069] hover:bg-[#006a57] text-white rounded-full shadow-md transition active:scale-95 flex items-center justify-center ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}`}>{isUploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}</button>
                                    ) : (
                                        <button onClick={startRecording} className="p-3 bg-[#008069] hover:bg-[#006a57] text-white rounded-full shadow-md transition active:scale-95"><Mic className="w-5 h-5" /></button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT SIDE: GROUP INFO / MESSAGE INFO */}
            {(showGroupInfo || showMessageInfo) && (
                <div className="fixed inset-0 z-50 md:static md:z-auto w-full md:w-[350px] bg-white md:border-l border-gray-200 flex flex-col h-full animate-in slide-in-from-right duration-300">
                    <div className="h-[64px] bg-gray-100 px-4 flex items-center gap-3 border-b border-gray-200 shrink-0">
                        <button onClick={() => { setShowGroupInfo(false); setShowMessageInfo(null); }} className="p-1 hover:bg-gray-200 rounded-full"><X className="w-6 h-6 text-gray-600" /></button>
                        <h2 className="font-semibold text-gray-700">{showMessageInfo ? "Message Info" : "Group Info"}</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-gray-50">
                        {showMessageInfo ? (
                            <div>
                                <div className="p-6 bg-white shadow-sm mb-2">
                                    <div className={`p-3 rounded-lg ${showMessageInfo.senderId === (currentUser.id || currentUser._id) ? "bg-[#d9fdd3]" : "bg-white border"}`}>
                                        {showMessageInfo.image && <img src={showMessageInfo.image} className="w-full h-auto rounded mb-2" />}
                                        {showMessageInfo.text && <p className="text-sm">{showMessageInfo.text}</p>}
                                        <div className="flex justify-end mt-1"><span className="text-[10px] text-gray-500">{new Date(showMessageInfo.createdAt).toLocaleTimeString()} <CheckCheck className="w-3 h-3 inline text-blue-500" /></span></div>
                                    </div>
                                </div>
                                <div className="bg-white shadow-sm">
                                    <div className="p-4 text-gray-500 text-sm font-bold flex items-center gap-2 border-b"><CheckCheck className="w-4 h-4 text-blue-500" /> Read by</div>
                                    {members
                                        .filter(m =>
                                            showMessageInfo.readBy &&
                                            showMessageInfo.readBy.includes(m._id) &&
                                            m._id !== showMessageInfo.senderId // 👈 Exclude sender
                                        )
                                        .map((m) => (
                                        <div key={m._id} className="flex items-center gap-3 p-3 border-b border-gray-50">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">{m.profileImage ? <img src={m.profileImage} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-gray-500" />}</div>
                                            <div>
                                                <h3 className="text-sm font-medium">{m.name}</h3>
                                                <p className="text-xs text-gray-400">Viewed</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="bg-white p-6 mb-2 shadow-sm flex flex-col items-center"><div className="w-24 h-24 md:w-32 md:h-32 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-5xl font-bold mb-4 overflow-hidden">{currentUser?.village?.charAt(0)}</div><h2 className="text-xl font-bold text-gray-800 text-center">{currentUser?.village}</h2><p className="text-gray-500 text-sm mt-1">{members.length} participants</p></div>
                                <div className="bg-white shadow-sm pb-6"><div className="p-4 text-green-600 font-bold text-sm border-b border-gray-100 bg-white sticky top-0">{members.length} participants</div>{loadingMembers ? <div className="p-6 text-center text-gray-400 text-sm">Loading...</div> : <div>{members.map((member) => (<div key={member._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 transition border-b border-gray-50 mx-2 cursor-pointer"><div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">{member.profileImage ? <img src={member.profileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500"><User className="w-5 h-5" /></div>}</div><div className="flex-1 min-w-0"><h3 className="font-medium text-gray-800 text-sm">{member.name} {member._id === currentUser.id && "(You)"}</h3><p className="text-xs text-gray-500 truncate">{member.bio || "Available"}</p></div></div>))}</div>}</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 🎨 THEME SELECTION MODAL */}
            {showThemeModal && (
                <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50"><h3 className="font-bold text-lg text-gray-800">Choose Chat Theme</h3><button onClick={() => setShowThemeModal(false)} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-5 h-5 text-gray-600" /></button></div>
                        <div className="p-6 overflow-y-auto bg-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4"><label className="cursor-pointer group relative aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-[#008069] flex flex-col items-center justify-center bg-white transition hover:bg-green-50"><Upload className="w-8 h-8 text-gray-400 group-hover:text-[#008069] mb-2" /><span className="text-xs text-gray-500 font-medium group-hover:text-[#008069]">Upload Custom</span><input type="file" accept="image/*" className="hidden" onChange={handleCustomUpload} /></label>{AGRI_THEMES.map((theme) => (<div key={theme.id} onClick={() => handleThemeSelect(theme)} className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition border-2 ${chatBackground.id === theme.id ? 'border-[#008069] ring-2 ring-green-100' : 'border-transparent'}`}><img src={theme.url} alt={theme.name} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition flex items-end p-2"><span className="text-white text-xs font-bold shadow-sm">{theme.name}</span></div>{chatBackground.id === theme.id && <div className="absolute top-2 right-2 bg-[#008069] text-white p-1 rounded-full"><Check className="w-3 h-3" /></div>}</div>))}</div>
                        <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-xs text-gray-500">Select a background to apply immediately. Changes are saved to your device.</div>
                    </div>
                </div>
            )}

            {/* 🖼️ IMAGE VIEWER OVERLAY */}
            {viewImage && (
                <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col animate-in fade-in duration-200">
                    <div className="flex items-center justify-between p-4 bg-black/40 text-white backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
                                {getSenderImage(viewImage) ? <img src={getSenderImage(viewImage)} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-gray-400" />}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">{viewImage.senderName}</span>
                                <span className="text-xs text-gray-300">{new Date(viewImage.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button className="p-2 hover:bg-white/10 rounded-full transition" title="Star" onClick={() => starMessage(viewImage._id)}><Star className={`w-6 h-6 ${viewImage.starredBy?.includes(currentUser.id || currentUser._id) ? "fill-yellow-500 text-yellow-500" : ""}`} /></button>
                            <button className="p-2 hover:bg-white/10 rounded-full transition" title="Reply" onClick={() => { setViewImage(null); setReplyingTo(viewImage); }}><Reply className="w-6 h-6" /></button>
                            <button className="p-2 hover:bg-white/10 rounded-full transition" title="Forward"><Forward className="w-6 h-6" /></button>
                            <button onClick={() => downloadImage(viewImage.image)} className="p-2 hover:bg-white/10 rounded-full transition" title="Download"><Download className="w-6 h-6" /></button>
                            <button onClick={() => setViewImage(null)} className="p-2 hover:bg-white/10 rounded-full transition"><X className="w-6 h-6" /></button>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                        <img src={viewImage.image} alt="Full View" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                    </div>
                    {viewImage.text && <div className="p-4 bg-black/40 text-white text-center backdrop-blur-md"><p>{viewImage.text}</p></div>}
                </div>
            )}
        </div>
    );
};

export default VillageChat;