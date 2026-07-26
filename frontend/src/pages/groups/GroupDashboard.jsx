import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, IndianRupee, Briefcase, CheckCircle2, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import { getUserGroups, getPersonalDashboard } from '../../api/groupService';

const GroupDashboard = () => {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [personalStats, setPersonalStats] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const userStr = localStorage.getItem('user');
    const currentUserId = userStr ? JSON.parse(userStr).id : null;
    
    // Check if user is admin of any group
    const isAdmin = groups.some(g => g.admins.includes(currentUserId) || g.createdBy === currentUserId);
    
    const [activeTab, setActiveTab] = useState('personal'); // Default to personal

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [groupsRes, statsRes] = await Promise.all([
                    getUserGroups(),
                    getPersonalDashboard()
                ]);
                setGroups(groupsRes.data.groups);
                setPersonalStats(statsRes.data.stats);
                
                // If they are an admin, maybe default to group dashboard, but personal is fine too.
                // Let's stick to personal as default for everyone to see their own stats first.
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Work Groups</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage farm labor and daily settlements</p>
                </div>
                
                <div className="flex mt-4 md:mt-0 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto">
                    <button 
                        onClick={() => setActiveTab('personal')}
                        className={`flex-1 md:px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'personal' ? 'bg-white dark:bg-slate-700 text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        My Dashboard
                    </button>
                    <button 
                        onClick={() => setActiveTab('groups')}
                        className={`flex-1 md:px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'groups' ? 'bg-white dark:bg-slate-700 text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Group Dashboard
                    </button>
                </div>
            </div>

            {activeTab === 'personal' ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="p-8 bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-lg shadow-green-500/20 relative overflow-hidden">
                            <IndianRupee className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
                            <div className="relative z-10">
                                <p className="text-green-100 font-medium mb-2">Total Earned</p>
                                <h2 className="text-4xl font-bold">₹{Math.round(personalStats?.totalEarned || 0)}</h2>
                                <p className="text-sm text-green-100 mt-4 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" /> Lifetime earnings
                                </p>
                            </div>
                        </Card>
                        <Card className="p-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 relative overflow-hidden">
                            <CheckCircle2 className="absolute -right-4 -bottom-4 w-32 h-32 text-amber-500/10" />
                            <div className="relative z-10">
                                <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">Pending Payments</p>
                                <h2 className="text-4xl font-bold text-amber-500">₹{Math.round(personalStats?.pendingEarned || 0)}</h2>
                                <p className="text-sm text-slate-500 mt-4">Awaiting settlement</p>
                            </div>
                        </Card>
                        <Card className="p-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 relative overflow-hidden">
                            <Briefcase className="absolute -right-4 -bottom-4 w-32 h-32 text-blue-500/10" />
                            <div className="relative z-10">
                                <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">Days Worked</p>
                                <h2 className="text-4xl font-bold text-blue-500">{personalStats?.daysWorked || 0}</h2>
                                <p className="text-sm text-slate-500 mt-4">Across {personalStats?.groupsCount || 0} groups</p>
                            </div>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div 
                        onClick={() => navigate('/groups/create')}
                        className="flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-green-200 dark:border-green-800/50 bg-green-50/30 dark:bg-green-900/10 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/10 min-h-[220px]"
                    >
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-800/50 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm">
                            <Plus className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-bold text-green-800 dark:text-green-300">Create New Group</h3>
                        <p className="text-sm text-green-600/80 dark:text-green-500/80 mt-2 text-center font-medium">Form a new team of farmers for collaborative work</p>
                    </div>

                    {groups.map((group, index) => (
                        <Card 
                            key={group._id} 
                            className="p-6 cursor-pointer hover:shadow-xl hover:shadow-green-500/5 dark:hover:shadow-green-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group border border-slate-200/60 dark:border-slate-700/60 rounded-3xl min-h-[220px] flex flex-col justify-between"
                            onClick={() => navigate(`/groups/${group._id}`)}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="absolute -top-6 -right-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                                <Users className="w-32 h-32 text-green-600" />
                            </div>
                            
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 relative z-10 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{group.name}</h3>
                                {group.village && <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 relative z-10 font-medium">{group.village}</p>}
                            </div>
                            
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-4 py-2 rounded-xl text-sm font-bold shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                                    <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    {group.members.length} Members
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GroupDashboard;
