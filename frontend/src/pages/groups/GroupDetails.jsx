import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToggleLeft, ToggleRight, ArrowLeft } from 'lucide-react';
import { getGroupById, getGroupAnalytics, getGroupWorkRecords } from '../../api/groupService';

import AdminDashboard from './admin/AdminDashboard';
import MemberDashboard from './member/MemberDashboard';

const GroupDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [group, setGroup] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const [viewMode, setViewMode] = useState('member'); // 'admin' or 'member'
    const [isAdmin, setIsAdmin] = useState(false);
    const userStr = localStorage.getItem('user');
    const currentUserId = userStr ? JSON.parse(userStr).id : null;

    const fetchData = async () => {
        try {
            setLoading(true);
            const [groupRes, analyticsRes, recordsRes] = await Promise.all([
                getGroupById(id),
                getGroupAnalytics(id),
                getGroupWorkRecords(id)
            ]);
            const fetchedGroup = groupRes.data.group;
            setGroup(fetchedGroup);
            setAnalytics(analyticsRes.data.analytics);
            setRecords(recordsRes.data.records);

            // Check permissions
            const isOwner = fetchedGroup.createdBy === currentUserId;
            const isGroupAdmin = isOwner || fetchedGroup.admins.some(admin => {
                const adminId = admin._id ? admin._id.toString() : admin.toString();
                return adminId === currentUserId;
            });
            setIsAdmin(isGroupAdmin);

            const savedMode = localStorage.getItem('groupViewMode');
            if (isGroupAdmin) {
                setViewMode(savedMode === 'admin' ? 'admin' : 'member');
            } else {
                setViewMode('member');
            }
        } catch (error) {
            console.error("Error fetching group details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleViewModeToggle = () => {
        if (!isAdmin) return;
        const newMode = viewMode === 'admin' ? 'member' : 'admin';
        setViewMode(newMode);
        localStorage.setItem('groupViewMode', newMode);
    };

    if (loading || !group) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        );
    }

    const isOwner = group.createdBy === currentUserId;
    
    // Fix: Handle populated m.user object correctly
    let currentUserMember = group.members.find(m => {
        if (!m.user) return false;
        const memberUserId = m.user._id ? m.user._id.toString() : m.user.toString();
        return memberUserId === currentUserId;
    });

    // Fallback: If for some reason they are an Owner/Admin but missing from the members array,
    // synthesize a member object so the UI doesn't break, per user requirements.
    if (!currentUserMember && (isAdmin || isOwner)) {
        currentUserMember = {
            _id: 'synthetic-member-' + currentUserId,
            user: currentUserId,
            name: 'Admin',
            role: isOwner ? 'owner' : 'admin',
            status: 'active'
        };
    }

    return (
        <div className="pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/groups')} className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 rounded-xl transition-colors shadow-sm">
                        <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{group.name}</h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{group.village || "Work Group"}</p>
                    </div>
                </div>
                
                {isAdmin && (
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800/90 px-5 py-2.5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80">
                        <span className={`text-sm font-bold tracking-wide transition-colors ${viewMode === 'member' ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>My View</span>
                        <button onClick={handleViewModeToggle} className="text-slate-300 hover:text-green-500 transition-colors drop-shadow-sm">
                            {viewMode === 'admin' ? <ToggleRight className="w-9 h-9 text-green-500" /> : <ToggleLeft className="w-9 h-9" />}
                        </button>
                        <span className={`text-sm font-bold tracking-wide transition-colors ${viewMode === 'admin' ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>Admin View</span>
                    </div>
                )}
            </div>
            
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {viewMode === 'admin' ? (
                    <AdminDashboard 
                        group={group} 
                        analytics={analytics} 
                        records={records} 
                        isOwner={isOwner} 
                        onUpdate={fetchData} 
                    />
                ) : (
                    <MemberDashboard 
                        group={group} 
                        analytics={analytics} 
                        records={records} 
                        currentUserMember={currentUserMember}
                        isAdmin={isAdmin}
                        isOwner={isOwner}
                    />
                )}
            </div>
        </div>
    );
};

export default GroupDetails;
