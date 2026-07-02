import { X, Check, Users } from 'lucide-react';
import api from '../../../utils/api';
import Swal from 'sweetalert2';
import SearchInput from '../../../components/common/SearchInput';
import { useState, useEffect } from 'react';
import { renderName, getAvatarUrl } from '../../../utils/userUtils';

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated, currentUser }) => {
    const [groupName, setGroupName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setGroupName('');
            setSearchQuery('');
            setSearchResults([]);
            setSelectedUsers([]);
        }
    }, [isOpen]);

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.trim().length > 2) {
            try {
                const token = localStorage.getItem("token");
                const { data } = await api.get(`/auth/search-users?q=${query}`, { headers: { "auth-token": token } });
                setSearchResults(data.filter(u => u._id !== (currentUser.id || currentUser._id)));
            } catch (err) { }
        } else {
            setSearchResults([]);
        }
    };

    const toggleUserSelection = (user) => {
        if (selectedUsers.find(u => u._id === user._id)) {
            setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) return Swal.fire('Error', 'Please enter a group name', 'error');
        if (selectedUsers.length === 0) return Swal.fire('Error', 'Please select at least one farmer', 'error');

        setIsCreating(true);
        try {
            const token = localStorage.getItem("token");
            const participantIds = [currentUser.id || currentUser._id, ...selectedUsers.map(u => u._id)];
            const { data } = await api.post("/chat/conversations", {
                participantIds,
                isGroup: true,
                groupName: groupName.trim()
            }, { headers: { "auth-token": token } });
            
            Swal.fire({ toast: true, position: 'bottom', icon: 'success', title: 'Group Created', timer: 1500, showConfirmButton: false });
            onGroupCreated(data);
            onClose();
        } catch (err) {
            Swal.fire('Error', 'Failed to create group', 'error');
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 md:p-4">
            <div className="bg-surface w-full h-[90vh] md:h-auto md:max-h-[85vh] md:max-w-md rounded-t-2xl md:rounded-2xl shadow-xl flex flex-col animate-in slide-in-from-bottom md:zoom-in-95">
                <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-background rounded-t-2xl">
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Create Group</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-text-muted transition"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-1">Group Name</label>
                        <input 
                            type="text" 
                            placeholder="E.g., Village Farmers" 
                            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary text-text-primary text-sm"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-1">Add Members</label>
                        <div className="mb-3">
                            <SearchInput 
                                placeholder="Search by name or phone..." 
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                        </div>
                        
                        {selectedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {selectedUsers.map(u => (
                                    <div key={u._id} className="flex items-center gap-1 bg-primary-light dark:bg-primary-dark text-text-primary dark:text-white px-2 py-1 rounded-lg text-xs font-medium border border-primary/20">
                                        {u.name} <button onClick={() => toggleUserSelection(u)}><X className="w-3 h-3 hover:text-red-500" /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="flex flex-col gap-1 border border-border rounded-xl max-h-[200px] overflow-y-auto p-1 bg-background">
                            {searchResults.length > 0 ? searchResults.map(user => {
                                const isSelected = selectedUsers.some(u => u._id === user._id);
                                return (
                                    <div key={user._id} onClick={() => toggleUserSelection(user)} className="flex items-center gap-3 p-2 hover:bg-surface cursor-pointer rounded-lg transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-700 font-bold text-sm">
                                            {user.profileImage ? <img src={user.profileImage} className="w-full h-full object-cover rounded-full" /> : user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-text-primary truncate">{user.name}</h4>
                                            <p className="text-xs text-text-muted truncate">{user.village} Village</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>
                                )
                            }) : (
                                <div className="p-4 text-center text-text-muted text-xs">
                                    {searchQuery.length > 2 ? 'No farmers found.' : 'Search to find farmers.'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="px-5 py-4 border-t border-border bg-background md:rounded-b-2xl pb-safe">
                    <button 
                        onClick={handleCreateGroup} 
                        disabled={isCreating}
                        className={`w-full py-2.5 rounded-xl text-white font-semibold flex justify-center items-center gap-2 transition-transform active:scale-95 ${isCreating ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover shadow-sm'}`}
                    >
                        {isCreating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Group'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
