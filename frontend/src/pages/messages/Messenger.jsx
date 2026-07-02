import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../../utils/api';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { Lock, Leaf } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;
const SERVER_URL = API_URL ? API_URL.replace('/api', '') : "http://localhost:5000";
const socket = io.connect(SERVER_URL);

const Messenger = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // For mobile
    
    // Split pane width
    const [sidebarWidth, setSidebarWidth] = useState(350);
    const isDragging = useRef(false);

    const refetchUser = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const { data } = await api.post("/auth/getuser", {}, { headers: { "auth-token": token } });
            setCurrentUser(data);
            localStorage.setItem("user", JSON.stringify(data));
        } catch (err) { console.error("Failed to refetch user", err); }
    };

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (!userStr) { navigate("/login"); return; }
        const user = JSON.parse(userStr);
        setCurrentUser(user);

        refetchUser(); // Fetch latest user details (e.g. blockedUsers)
        fetchConversations(user);
    }, [navigate]);

    const fetchConversations = async (user) => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await api.get("/chat/conversations", { headers: { "auth-token": token } });
            
            // Auto-initialize Self Chat if missing
            const activeUser = user || currentUser;
            const hasSelfChat = data.some(conv => 
                !conv.isGroup && 
                conv.participants.length === 1 && 
                (conv.participants[0]._id === activeUser.id || conv.participants[0]._id === activeUser._id)
            );

            if (!hasSelfChat && activeUser) {
                const res = await api.post("/chat/conversations", {
                    participantIds: [activeUser.id || activeUser._id],
                    isGroup: false
                }, { headers: { "auth-token": token } });
                setConversations([res.data, ...data]);
            } else {
                setConversations(data);
            }
        } catch (err) { console.error("Failed to fetch conversations", err); }
    };

    useEffect(() => {
        const handleSocketUpdate = () => {
            if (currentUser) fetchConversations(currentUser);
        };
        socket.on("receive_message", handleSocketUpdate);
        socket.on("message_sent", handleSocketUpdate);
        socket.on("message_updated", handleSocketUpdate);
        return () => {
            socket.off("receive_message", handleSocketUpdate);
            socket.off("message_sent", handleSocketUpdate);
            socket.off("message_updated", handleSocketUpdate);
        };
    }, [currentUser]);

    const handleMouseDown = (e) => {
        isDragging.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        let newWidth = e.clientX;
        if (newWidth < 250) newWidth = 250;
        if (newWidth > 500) newWidth = 500;
        setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleSelectConversation = (conv) => {
        setActiveConversation(conv);
        // On mobile, hide sidebar when chat is selected
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="flex w-full h-[100dvh] bg-background overflow-hidden relative">
            {/* Sidebar */}
            <div 
                style={{ width: window.innerWidth < 768 ? '100%' : sidebarWidth }}
                className={`h-full flex flex-col border-r border-border bg-surface transition-transform absolute md:relative z-20
                    ${window.innerWidth < 768 && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
                `}
            >
                <Sidebar 
                    currentUser={currentUser}
                    conversations={conversations}
                    activeConversation={activeConversation}
                    onSelectConversation={handleSelectConversation}
                    fetchConversations={fetchConversations}
                />
            </div>

            {/* Resizer Divider (Desktop only) */}
            <div 
                className="hidden md:block w-1.5 cursor-col-resize hover:bg-blue-500/50 bg-border/50 z-30 transition-colors"
                onMouseDown={handleMouseDown}
            />

            {/* Main Chat Window */}
            <div className="flex-1 h-full relative z-10 flex flex-col bg-[#e5ddd5] dark:bg-[#0b141a]">
                {activeConversation ? (
                    <ChatWindow 
                        currentUser={currentUser}
                        conversation={activeConversation}
                        socket={socket}
                        goBack={() => setIsSidebarOpen(true)}
                        fetchConversations={fetchConversations}
                        onSelectConversation={handleSelectConversation}
                        refetchUser={refetchUser}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-text-muted bg-[#f0f2f5] dark:bg-[#222e35] h-full w-full relative border-b-8 border-b-primary">
                        <div className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.03] dark:opacity-[0.01] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }} />
                        <div className="z-10 flex flex-col items-center text-center max-w-md px-6">
                            <div className="w-64 h-64 mb-6 rounded-full flex items-center justify-center">
                                {/* Vector illustration style minimal logo */}
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <div className="absolute w-48 h-48 bg-primary/10 rounded-full animate-pulse"></div>
                                    <Leaf className="w-24 h-24 text-primary opacity-80" strokeWidth={1} />
                                </div>
                            </div>
                            <h2 className="text-3xl font-light text-text-primary dark:text-gray-200 mb-3 tracking-wide">AgriSpine Web</h2>
                            <p className="text-[15px] text-text-secondary dark:text-gray-400 mb-8 leading-relaxed">
                                Connect with your farming community.<br/>
                                Select a chat to start messaging.
                            </p>
                        </div>
                        
                        <div className="absolute bottom-10 flex items-center justify-center gap-2 text-xs text-text-muted dark:text-gray-500 font-medium">
                            <Lock className="w-3 h-3" /> End-to-end encrypted
                        </div>
                    </div>
                )}
            </div>
          {/* Floating Module AI Chat */}
        </div>
    );
};

export default Messenger;
