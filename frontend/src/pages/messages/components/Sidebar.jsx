import { Filter, MessageSquarePlus, User as UserIcon } from 'lucide-react';
import api from '../../../utils/api';
import Swal from 'sweetalert2';
import CreateGroupModal from './CreateGroupModal';
import SearchInput from '../../../components/common/SearchInput';
import { useState } from 'react';
import { renderName, getAvatarUrl } from '../../../utils/userUtils';

const Sidebar = ({ currentUser, conversations, activeConversation, onSelectConversation, fetchConversations }) => {
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('All'); // All, Unread, Groups, Favorites
    const [isSearchingNew, setIsSearchingNew] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    const getOtherParticipant = (conv) => {
        if (conv.isGroup) return null;
        if (conv.participants.length === 1) return currentUser; // Self chat
        return conv.participants.find(p => p._id !== (currentUser.id || currentUser._id)) || currentUser;
    };

    const getChatName = (conv) => {
        if (conv.isGroup) return conv.groupName;
        const otherUser = getOtherParticipant(conv);
        return otherUser ? renderName(otherUser, currentUser) : "Unknown User";
    };

    const getChatIcon = (conv) => {
        if (conv.isGroup) return conv.groupIcon || `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.groupName || 'Group')}&background=random`;
        const otherUser = getOtherParticipant(conv);
        return getAvatarUrl(otherUser);
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.trim().length > 2) {
            setIsSearchingNew(true);
            try {
                // Assuming we have an endpoint to search users
                const token = localStorage.getItem("token");
                const { data } = await api.get(`/auth/search-users?q=${query}`, { headers: { "auth-token": token } });
                setSearchResults(data);
            } catch (err) { console.error("Failed to fetch conversations", err); }
        } else {
            setIsSearchingNew(false);
            setSearchResults([]);
        }
    };

    const startNewChat = async (userToChat) => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await api.post("/chat/conversations", {
                participantIds: [userToChat._id],
                isGroup: false
            }, { headers: { "auth-token": token } });
            
            fetchConversations();
            onSelectConversation(data);
            setSearchQuery('');
            setIsSearchingNew(false);
        } catch (err) {
            Swal.fire("Error", "Could not start chat", "error");
        }
    };

    const filteredConversations = conversations.filter(conv => {
        if (searchQuery && !isSearchingNew) {
            if (!getChatName(conv).toLowerCase().includes(searchQuery.toLowerCase())) return false;
        }

        if (filter === 'Groups' && !conv.isGroup) return false;
        
        if (filter === 'Unread') {
            const latestMsg = conv.latestMessage;
            if (!latestMsg) return false;
            const myId = currentUser.id || currentUser._id;
            const isMyMsg = latestMsg.senderId === myId;
            const isReadByMe = latestMsg.readBy?.includes(myId);
            if (isMyMsg || isReadByMe) return false;
        }

        if (filter === 'Favorites') {
            // Using pinned message as a proxy for "favorite" chat
            if (!conv.pinnedMessage) return false;
        }
        
        return true;
    });

    return (
        <div className="flex flex-col h-full w-full select-none">
            {/* Header */}
            <div className="bg-surface px-4 py-3 flex items-center justify-between border-b border-border shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center overflow-hidden border border-border">
                        <img src={getAvatarUrl(currentUser)} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-text-primary leading-tight">Chats</h2>
                        <p className="text-xs text-text-muted">{currentUser.name}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsCreateGroupModalOpen(true)} className="p-2 rounded-full hover:bg-background text-text-secondary transition-colors" title="Create Group">
                        <MessageSquarePlus className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-background text-text-secondary transition-colors">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="px-4 py-3 bg-surface">
                <SearchInput 
                    placeholder="Search chats or find new farmers..." 
                    value={searchQuery}
                    onChange={handleSearch}
                />
            </div>

            {/* Filter Chips */}
            {!isSearchingNew && (
                <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide shrink-0 bg-surface">
                    {['All', 'Unread', 'Favorites', 'Groups'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                filter === f 
                                ? 'bg-primary text-white' 
                                : 'bg-background text-text-secondary hover:bg-border'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            )}

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto bg-background">
                {isSearchingNew ? (
                    <div className="p-2">
                        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-2">Global Search Results</h3>
                        {searchResults.length > 0 ? searchResults.map(user => (
                            <div key={user._id} onClick={() => startNewChat(user)} className="flex items-center gap-3 p-3 hover:bg-surface cursor-pointer rounded-lg transition-colors mx-1">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex-shrink-0 overflow-hidden flex items-center justify-center relative border border-border">
                                    <img src={getAvatarUrl(user)} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-text-primary truncate">{renderName(user, currentUser)}</h4>
                                    <p className="text-xs text-text-muted truncate">{user.village} Village</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-sm text-text-muted py-4">No users found.</p>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {filteredConversations.length > 0 ? filteredConversations.map(conv => {
                            const isSelected = activeConversation?._id === conv._id;
                            const chatName = getChatName(conv);
                            const icon = getChatIcon(conv);
                            
                            // Simple formatting for latest message time
                            const timeString = conv.latestMessage ? new Date(conv.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                            
                            return (
                                <div 
                                    key={conv._id}
                                    onClick={() => onSelectConversation(conv)}
                                    className={`flex items-center gap-3 p-3 cursor-pointer border-b border-border transition-colors ${
                                        isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-surface'
                                    }`}
                                >
                                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0 flex items-center justify-center overflow-hidden relative border border-border shadow-sm text-blue-700 dark:text-blue-300 font-bold text-lg">
                                        <img src={icon} alt="Chat Icon" className="w-full h-full object-cover" />
                                        {conv.isGroup && (
                                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-primary rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                                <span className="text-[8px] text-white font-bold">G</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="text-base font-semibold text-text-primary truncate">{chatName}</h4>
                                            <span className="text-xs text-text-muted shrink-0 ml-2">{timeString}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-text-secondary truncate">
                                                {conv.latestMessage ? (
                                                    conv.latestMessage.isDeleted ? "🚫 This message was deleted" :
                                                    conv.latestMessage.text || (conv.latestMessage.image ? "📷 Photo" : "🎤 Audio")
                                                ) : (
                                                    <span className="italic">No messages yet</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="text-center py-10 px-4">
                                <p className="text-text-muted text-sm">No conversations found.</p>
                                <p className="text-xs text-text-secondary mt-1">Use the search bar above to find farmers and start chatting.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <CreateGroupModal 
                isOpen={isCreateGroupModalOpen} 
                onClose={() => setIsCreateGroupModalOpen(false)} 
                currentUser={currentUser} 
                onGroupCreated={(newConv) => {
                    fetchConversations();
                    onSelectConversation(newConv);
                }} 
            />
        </div>
    );
};

export default Sidebar;
