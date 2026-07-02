import React, { useEffect, useState, useRef } from "react";
import api from "../../../utils/api";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import { Check, ArrowLeft, Search, MoreVertical, X, CheckSquare, Image as ImageIcon, Pin } from "lucide-react";
import MessageInput from "./MessageInput";
import MessageBubble from "./MessageBubble";
import ChatSelectionHeader from "./ChatSelectionHeader";
import ImageViewer from "./ImageViewer";
import ThemeModal from "./ThemeModal";
import ChatInfoSidebar from "./ChatInfoSidebar";
import CameraModal from "./CameraModal";
import CreatePollModal from "./CreatePollModal";
import SearchInput from "../../../components/common/SearchInput";
import { useChatSocket } from "../../../hooks/useChatSocket";
import { useVoiceRecorder } from "../../../hooks/useVoiceRecorder";
import { useChatSelection } from "../../../hooks/useChatSelection";
import { groupMessagesByDate, getUserColor } from "../utils/chatHelpers";
import { renderName, getAvatarUrl } from "../../../utils/userUtils";

const AGRI_THEMES = [
    { id: 'default', name: 'Default Green', url: 'https://www.transparenttextures.com/patterns/cubes.png', color: '#e5ddd5' },
    { id: 'dark', name: 'Dark Mode', url: 'https://www.transparenttextures.com/patterns/black-linen.png', color: '#111827' },
    { id: 'nature', name: 'Nature', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', color: '#e5ddd5' },
    { id: 'wheat', name: 'Golden Wheat', url: 'https://images.unsplash.com/photo-1501430654243-c934cec2e1c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', color: '#fcf8f2' }
];

const ChatWindow = ({ currentUser, conversation, socket, goBack, fetchConversations, onSelectConversation, refetchUser }) => {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState("");
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showInputEmoji, setShowInputEmoji] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(null);
    const [viewImage, setViewImage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showThemeModal, setShowThemeModal] = useState(false);
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [showPollModal, setShowPollModal] = useState(false);
    const [chatBackground, setChatBackground] = useState(AGRI_THEMES[0]);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [showMessageInfo, setShowMessageInfo] = useState(null);
    const [showPollInfo, setShowPollInfo] = useState(null);
    const [members, setMembers] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const typingTimeoutRef = useRef(null);

    const getOtherParticipant = () => {
        if (conversation.isGroup) return null;
        if (conversation.participants.length === 1) return currentUser; 
        return conversation.participants.find(p => p._id !== (currentUser.id || currentUser._id)) || currentUser;
    };

    const chatName = conversation.isGroup ? conversation.groupName : renderName(getOtherParticipant(), currentUser) || "Unknown";
    const chatIcon = conversation.isGroup 
        ? conversation.groupIcon || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.groupName || 'Group')}&background=random` 
        : getAvatarUrl(getOtherParticipant());

    const isBlocked = conversation.isGroup ? false : currentUser?.blockedUsers?.some(u => {
        const id = u._id || u;
        return id === getOtherParticipant()?._id;
    });

    const getFileUrl = (path) => {
        if (!path) return null;
        if (path.includes("http") && !path.includes("localhost")) return path;
        const SERVER_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:5000";
        if (path.includes("localhost")) return path.replace("http://localhost:5000", SERVER_URL);
        if (path.startsWith("/")) return `${SERVER_URL}${path}`;
        return path;
    };

    useEffect(() => {
        setMembers(conversation.participants);
        const fetchMsgs = async () => {
            try {
                const token = localStorage.getItem("token");
                const { data } = await api.get(`/chat/messages/${conversation._id}`, { headers: { "auth-token": token } });
                setMessages(data);
            } catch (e) { console.error("Failed to fetch messages"); }
        };
        fetchMsgs();
        
        const savedTheme = localStorage.getItem("chat_theme");
        if (savedTheme) { try { setChatBackground(JSON.parse(savedTheme)); } catch (e) {} }
    }, [conversation._id, conversation.participants]);

    const handleThemeSelect = (theme) => {
        setChatBackground(theme);
        localStorage.setItem("chat_theme", JSON.stringify(theme));
    };

    const handleCustomUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const customTheme = { id: 'custom', name: 'Custom Photo', url: reader.result, color: '#e5ddd5' };
                handleThemeSelect(customTheme);
            };
            reader.readAsDataURL(file);
        }
    };

    useChatSocket(conversation._id, currentUser?.id || currentUser?._id, setMessages, socket);

    useEffect(() => {
        const handleTypingEvent = (data) => {
            if (data.conversationId === conversation._id && data.user !== currentUser.name) {
                setTypingUsers(prev => prev.includes(data.user) ? prev : [...prev, data.user]);
            }
        };
        const handleStopTypingEvent = (data) => {
            if (data.conversationId === conversation._id) {
                setTypingUsers(prev => prev.filter(u => u !== data.user));
            }
        };
        socket.on("typing", handleTypingEvent);
        socket.on("stop_typing", handleStopTypingEvent);
        return () => {
            socket.off("typing", handleTypingEvent);
            socket.off("stop_typing", handleStopTypingEvent);
        };
    }, [conversation._id, currentUser.name, socket]);

    const {
        selectionMode, setSelectionMode, selectedMessages, selectionMenuOpen, setSelectionMenuOpen,
        activeMessageMenu, setActiveMessageMenu, toggleSelection, startSelection, cancelSelection,
        handleReplySelected, handleInfoSelected, handleCopySelected, handleBulkStar, handleBulkDelete,
        handleDeleteSingle, starMessage
    } = useChatSelection(messages, setMessages, socket, currentUser, t, () => {}, setShowMessageInfo, setShowGroupInfo, setReplyingTo, conversation._id);

    const {
        isRecording, recordingTime, startRecording, stopRecording, cancelRecording, sendAudioMessage, formatTime
    } = useVoiceRecorder(socket, currentUser, t, conversation._id);

    useEffect(() => {
        if (!selectionMode && !isSearching) {
            const timer = setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, 100);
            return () => clearTimeout(timer);
        }
    }, [messages, selectionMode, isSearching]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setImagePreview(reader.result);
                reader.readAsDataURL(file);
            } else if (file.type.startsWith('video/')) {
                setFilePreview({ type: 'video', name: file.name, size: file.size });
            } else {
                setFilePreview({ type: 'document', name: file.name, size: file.size });
            }
        }
    };

    const clearAttachment = () => { setSelectedFile(null); setImagePreview(null); setFilePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; };

    const handleCameraCapture = (file) => {
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleCreatePoll = async (pollData) => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await api.post("/poll/create", { ...pollData, conversationId: conversation._id }, { headers: { "auth-token": token } });
            
            const messageData = { 
                senderId: currentUser.id || currentUser._id, 
                senderName: currentUser.name, 
                conversationId: conversation._id, 
                village: currentUser.village,
                poll: data, // Save the full poll object
                createdAt: new Date() 
            };
            await socket.emit("send_message", messageData);
        } catch (error) {
            Swal.fire("Error", "Failed to create poll", "error");
        }
    };

    const handleVotePoll = (pollId, optionIndex) => {
        socket.emit("vote_poll", {
            pollId,
            optionIndex,
            userId: currentUser.id || currentUser._id,
            conversationId: conversation._id
        });
    };

    const handleTyping = () => {
        socket.emit("typing", { conversationId: conversation._id, user: currentUser.name });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stop_typing", { conversationId: conversation._id, user: currentUser.name });
        }, 2000);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (currentMessage.trim() === "" && !selectedFile) return;
        setIsUploading(true);
        let fileData = {};
        if (selectedFile) {
            const formData = new FormData();
            formData.append("file", selectedFile);
            try {
                const token = localStorage.getItem("token");
                const { data } = await api.post("/chat/upload", formData, { headers: { "auth-token": token, "Content-Type": "multipart/form-data" } });
                
                if (data.fileType.startsWith('image/')) {
                    fileData.image = data.fileUrl;
                } else {
                    fileData.file = data.fileUrl;
                    fileData.fileName = data.fileName;
                    fileData.fileSize = data.fileSize;
                    fileData.fileType = data.fileType;
                }
            } catch (err) { Swal.fire("Error", "File upload failed", "error"); setIsUploading(false); return; }
        }
        const messageData = { 
            senderId: currentUser.id || currentUser._id, 
            senderName: currentUser.name, 
            conversationId: conversation._id, 
            village: currentUser.village, // backward compatibility
            text: currentMessage, 
            ...fileData,
            replyTo: replyingTo ? replyingTo._id : null, 
            replyText: replyingTo ? replyingTo.text : "", 
            createdAt: new Date() 
        };
        await socket.emit("send_message", messageData);
        setCurrentMessage(""); clearAttachment(); setReplyingTo(null); setShowInputEmoji(false); setIsUploading(false);
        fetchConversations();
    };

    const reactToMessage = async (msgId, emoji) => { try { const token = localStorage.getItem("token"); const { data } = await api.put(`/chat/react/${msgId}`, { emoji }, { headers: { "auth-token": token } }); socket.emit("update_message", { message: data, conversationId: conversation._id }); } catch (err) {} setActiveMessageMenu(null); setShowReactionPicker(null); };
    const removeReaction = async (msgId) => { try { const token = localStorage.getItem("token"); const { data } = await api.put(`/chat/react/remove/${msgId}`, {}, { headers: { "auth-token": token } }); socket.emit("update_message", { message: data, conversationId: conversation._id }); } catch (err) {} };
    
    const pinMessage = async (msgId) => {
        try {
            const token = localStorage.getItem("token");
            await api.put(`/chat/conversations/${conversation._id}/pin`, { messageId: msgId }, { headers: { "auth-token": token } });
            fetchConversations(); // refresh to get pinned message
            Swal.fire({ toast: true, position: 'bottom', icon: 'success', title: 'Message Pinned', timer: 1500, showConfirmButton: false });
        } catch(e) {
            console.error("Failed to pin");
        }
    };

    const unpinMessage = async () => {
        try {
            const token = localStorage.getItem("token");
            await api.put(`/chat/conversations/${conversation._id}/pin`, { messageId: null }, { headers: { "auth-token": token } });
            fetchConversations();
        } catch(e) {}
    };

    const getSenderImage = (msg) => {
        if (msg.senderImage) return getFileUrl(msg.senderImage);
        const member = members.find(m => m._id === msg.senderId);
        return member ? getAvatarUrl(member) : getAvatarUrl({name: msg.senderName});
    };

    const handleDownloadImage = async (url) => {
        if (!url) return;
        try {
            const fullUrl = getFileUrl(url);
            const response = await fetch(fullUrl);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = url.split('/').pop() || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error("Download failed", error);
            Swal.fire({ toast: true, position: 'bottom', icon: 'error', title: 'Download failed', timer: 2000, showConfirmButton: false });
        }
    };

    const groupedMessages = groupMessagesByDate(messages, isSearching, searchQuery, t);
    
    const currentViewImage = viewImage ? (messages.find(m => m._id === viewImage._id) || viewImage) : null;

    return (
        <div className="flex-1 flex flex-col h-full w-full relative">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain" onChange={handleFileSelect} />
            <div className="absolute inset-0 z-0 bg-cover bg-center opacity-60 dark:opacity-20 pointer-events-none" style={{ backgroundImage: `url('${chatBackground.url}')`, backgroundColor: chatBackground.color }} />

            {/* Header */}
            <div className="bg-surface px-4 py-3 flex items-center justify-between text-text-primary shadow-md z-20 shrink-0 border-b border-border select-none">
                <div className="flex items-center gap-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-1 -ml-1 rounded transition" onClick={() => setShowGroupInfo(true)}>
                    <button onClick={(e) => { e.stopPropagation(); goBack(); }} className="md:hidden p-1 hover:bg-background rounded-full transition-colors"><ArrowLeft className="w-6 h-6" /></button>
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {chatIcon ? <img src={chatIcon} className="w-full h-full object-cover" /> : <div className="font-bold text-lg">{chatName.charAt(0)}</div>}
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight truncate">{chatName}</h1>
                        <p className="text-xs text-text-muted">
                            {typingUsers.length > 0 ? <span className="text-primary animate-pulse">{typingUsers.join(', ')} is typing...</span> : (conversation.isGroup ? 'Group Chat' : 'Farmer')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 relative">
                    <Search className="w-5 h-5 cursor-pointer hover:opacity-80" onClick={() => setIsSearching(!isSearching)} />
                    <MoreVertical className="w-5 h-5 cursor-pointer hover:opacity-80" onClick={() => setHeaderMenuOpen(!headerMenuOpen)} />
                    {headerMenuOpen && (
                        <div className="absolute right-0 top-10 w-48 bg-surface border border-border shadow-xl rounded-xl py-2 z-50">
                            {conversation.isGroup && <button className="w-full text-left px-4 py-2 hover:bg-background text-sm" onClick={() => { setShowGroupInfo(true); setHeaderMenuOpen(false); }}>Group Info</button>}
                            {!conversation.isGroup && <button className="w-full text-left px-4 py-2 hover:bg-background text-sm" onClick={() => { setShowGroupInfo(true); setHeaderMenuOpen(false); }}>Contact Info</button>}
                            <button className="w-full text-left px-4 py-2 hover:bg-background text-sm flex gap-2" onClick={() => { setSelectionMode(true); setHeaderMenuOpen(false); }}><CheckSquare className="w-4 h-4"/> Select Messages</button>
                            <button className="w-full text-left px-4 py-2 hover:bg-background text-sm flex gap-2" onClick={() => { setShowThemeModal(true); setHeaderMenuOpen(false); }}>Change Theme</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Pinned Message Banner */}
            {conversation.pinnedMessage && typeof conversation.pinnedMessage === 'object' && (
                <div className="bg-surface/90 backdrop-blur border-b border-border px-4 py-2 flex items-center justify-between z-10 shadow-sm cursor-pointer">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Pin className="w-4 h-4 text-primary shrink-0" />
                        <div className="text-xs">
                            <span className="font-semibold text-primary">Pinned:</span>
                            <span className="text-text-secondary ml-1 truncate">{conversation.pinnedMessage.text || "Attachment"}</span>
                        </div>
                    </div>
                    <X className="w-4 h-4 text-text-muted cursor-pointer hover:text-text-primary shrink-0" onClick={unpinMessage} />
                </div>
            )}

            {/* Search Bar Inline */}
            {isSearching && (
                <div className="bg-surface px-4 py-2 flex items-center gap-3 shadow-sm border-b border-border z-20 shrink-0">
                    <SearchInput 
                        placeholder="Search in chat..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <X className="w-6 h-6 cursor-pointer text-text-muted hover:text-text-primary transition-colors" onClick={() => { setIsSearching(false); setSearchQuery(""); }} />
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-2 md:px-4 pt-4 pb-2 relative z-10" onClick={() => { setHeaderMenuOpen(false); setActiveMessageMenu(null); setShowInputEmoji(false); setShowReactionPicker(null); setSelectionMenuOpen(false); }}>
                {Object.keys(groupedMessages).map((date) => (
                    <div key={date}>
                        <div className="sticky top-2 z-30 flex justify-center mb-4 pointer-events-none"><span className="bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 text-xs font-medium px-3 py-1 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">{date}</span></div>
                        {groupedMessages[date].map((msg, index) => {
                            const isMe = msg.senderId === (currentUser.id || currentUser._id);
                            const prevMsg = index > 0 ? groupedMessages[date][index - 1] : null;
                            const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId;

                            return (
                                <MessageBubble
                                    key={msg._id} msg={msg} isMe={isMe} isStarred={msg.starredBy?.includes(currentUser.id || currentUser._id)}
                                    profileImg={getSenderImage(msg)} isSelected={selectedMessages.includes(msg._id)} selectionMode={selectionMode}
                                    isDeleted={msg.isDeleted} isNearBottom={messages.findIndex(m => m._id === msg._id) > messages.length - 3}
                                    toggleSelection={toggleSelection} getUserColor={getUserColor} getFileUrl={getFileUrl} getTickStatus={(m) => {
                                        if (!m.status || m.status === 'sent') return <Check className="w-3.5 h-3.5 text-gray-400" />;
                                        if (m.status === 'delivered') return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />;
                                        if (m.status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
                                        return <Check className="w-3.5 h-3.5 text-gray-400" />;
                                    }}
                                    setViewImage={setViewImage} startSelection={startSelection} activeMessageMenu={activeMessageMenu}
                                    setActiveMessageMenu={setActiveMessageMenu} handleDeleteSingle={handleDeleteSingle} showReactionPicker={showReactionPicker}
                                    setShowReactionPicker={setShowReactionPicker} reactToMessage={reactToMessage} removeReaction={removeReaction}
                                    starMessage={starMessage} setReplyingTo={setReplyingTo} currentUser={currentUser}
                                    searchQuery={searchQuery} t={t} isConsecutive={isConsecutive} handleVotePoll={handleVotePoll}
                                    setShowPollInfo={setShowPollInfo}
                                />
                            );
                        })}
                    </div>
                ))}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input */}
            <div className="z-20 shrink-0">
                {isBlocked ? (
                    <div className="p-4 bg-surface border-t border-border text-center">
                        <p className="text-text-muted text-sm font-medium">You have blocked this contact. Unblock to send a message.</p>
                    </div>
                ) : (
                    <MessageInput
                        currentMessage={currentMessage} setCurrentMessage={setCurrentMessage} sendMessage={sendMessage}
                        isUploading={isUploading} imagePreview={imagePreview} filePreview={filePreview} clearAttachment={clearAttachment}
                        replyingTo={replyingTo} setReplyingTo={setReplyingTo} showInputEmoji={showInputEmoji} setShowInputEmoji={setShowInputEmoji}
                        isRecording={isRecording} recordingTime={recordingTime} startRecording={startRecording} cancelRecording={cancelRecording}
                        sendAudioMessage={sendAudioMessage} stopRecording={stopRecording} formatTime={formatTime} 
                        handleDocumentAttach={() => { if(fileInputRef.current) { fileInputRef.current.accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"; fileInputRef.current.click(); } }} 
                        handleGalleryAttach={() => { if(fileInputRef.current) { fileInputRef.current.accept = "image/*,video/*"; fileInputRef.current.click(); } }} 
                        handleCameraAttach={() => setShowCameraModal(true)}
                        handlePollAttach={() => setShowPollModal(true)}
                        t={t} onTyping={handleTyping}
                    />
                )}
            </div>
            
            <ImageViewer viewImage={currentViewImage} setViewImage={setViewImage} getSenderImage={getSenderImage} getFileUrl={getFileUrl} currentUser={currentUser} starMessage={starMessage} setReplyingTo={setReplyingTo} downloadImage={handleDownloadImage} />
            
            <CameraModal show={showCameraModal} onClose={() => setShowCameraModal(false)} onCapture={handleCameraCapture} t={t} />
            <CreatePollModal show={showPollModal} onClose={() => setShowPollModal(false)} onCreate={handleCreatePoll} t={t} />

            <ChatInfoSidebar  
                showGroupInfo={showGroupInfo} setShowGroupInfo={setShowGroupInfo} 
                showMessageInfo={showMessageInfo} setShowMessageInfo={setShowMessageInfo} 
                showPollInfo={showPollInfo} setShowPollInfo={setShowPollInfo}
                currentUser={currentUser} members={members} loadingMembers={false} t={t}
                activeChat={conversation}
                onStartPrivateChat={(newConv) => {
                    fetchConversations();
                    if (onSelectConversation) onSelectConversation(newConv);
                }}
                refetchUser={refetchUser}
                fetchConversations={fetchConversations}
            />

            <ThemeModal 
                showThemeModal={showThemeModal} 
                setShowThemeModal={setShowThemeModal} 
                chatBackground={chatBackground} 
                handleThemeSelect={handleThemeSelect} 
                handleCustomUpload={handleCustomUpload} 
                AGRI_THEMES={AGRI_THEMES} 
                t={t} 
            />
        </div>
    );
};

export default ChatWindow;
