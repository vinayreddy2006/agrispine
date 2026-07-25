import React, { useState, useEffect } from 'react';
import { IndianRupee, Briefcase, CheckCircle2, TrendingUp, Calendar, Map, Users, Target, Clock, ShieldCheck, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import { getPersonalDashboard } from '../../api/groupService';

const PersonalDashboard = () => {
    const [stats, setStats] = useState(null);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getPersonalDashboard();
                if (res.data && res.data.data) {
                    setStats(res.data.data.stats);
                    setGroups(res.data.data.groups);
                } else if (res.data && res.data.stats) {
                     // Fallback
                     setStats(res.data.stats.stats);
                     setGroups(res.data.stats.groups);
                }
            } catch (error) {
                console.error("Failed to fetch personal stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (!stats) {
        return <div className="text-center p-8 text-slate-500">Failed to load personal dashboard.</div>;
    }

    return (
        <div className="pb-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <PageHeader title="My Work & Earnings" subtitle="Your personal farming contributions across all groups" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-lg shadow-green-500/20 relative overflow-hidden lg:col-span-2">
                    <IndianRupee className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
                    <div className="relative z-10 flex justify-between items-end">
                        <div>
                            <p className="text-green-100 font-medium mb-1">Total Earned</p>
                            <h2 className="text-4xl font-bold">₹{Math.round(stats.totalEarned)}</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-green-100 mb-1">Settled</p>
                            <p className="text-xl font-bold">₹{Math.round(stats.settledEarned)}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 relative overflow-hidden">
                    <Clock className="absolute -right-4 -bottom-4 w-24 h-24 text-amber-500/10" />
                    <div className="relative z-10">
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Pending Payments</p>
                        <h2 className="text-3xl font-bold text-amber-500">₹{Math.round(stats.pendingEarned)}</h2>
                    </div>
                </Card>

                <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 relative overflow-hidden">
                    <Calendar className="absolute -right-4 -bottom-4 w-24 h-24 text-blue-500/10" />
                    <div className="relative z-10">
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">Total Work Days</p>
                        <h2 className="text-3xl font-bold text-blue-500">{stats.daysWorked}</h2>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
                <Card className="p-4 bg-white dark:bg-slate-800 flex flex-col justify-center border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Acres Worked</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1"><Map className="w-4 h-4 text-emerald-500"/> {stats.totalAcres.toFixed(1)}</p>
                </Card>
                <Card className="p-4 bg-white dark:bg-slate-800 flex flex-col justify-center border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Avg/Day</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1"><TrendingUp className="w-4 h-4 text-emerald-500"/> ₹{Math.round(stats.avgEarningsPerDay)}</p>
                </Card>
                <Card className="p-4 bg-white dark:bg-slate-800 flex flex-col justify-center border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Avg/Acre</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1"><TrendingUp className="w-4 h-4 text-emerald-500"/> ₹{Math.round(stats.avgEarningsPerAcre)}</p>
                </Card>
                <Card className="p-4 bg-white dark:bg-slate-800 flex flex-col justify-center border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Attendance</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1"><Target className="w-4 h-4 text-indigo-500"/> {Math.round(stats.attendancePercentage)}%</p>
                </Card>
                <Card className="p-4 bg-white dark:bg-slate-800 flex flex-col justify-center border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Active Groups</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1"><Users className="w-4 h-4 text-blue-500"/> {stats.activeGroups}</p>
                </Card>
                <Card className="p-4 bg-white dark:bg-slate-800 flex flex-col justify-center border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Closed Groups</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1"><Briefcase className="w-4 h-4 text-slate-400"/> {stats.closedGroups}</p>
                </Card>
            </div>
            
            <div className="mt-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">My Work Groups</h3>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-3 py-1 rounded-full font-semibold">{stats.groupsCount} Joined</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {groups.map(group => (
                        <Card 
                            key={group._id} 
                            onClick={() => navigate(`/groups/${group._id}`)}
                            className="p-5 hover:border-green-500 dark:hover:border-green-500 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-green-600 transition-colors text-lg">{group.name}</h4>
                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3"/> {group.village}</p>
                                </div>
                                <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${group.status === 'closed' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' : 'bg-green-100 text-green-700'}`}>
                                    {group.status === 'closed' ? 'CLOSED' : 'ACTIVE'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Total Earned</p>
                                    <p className="font-bold text-slate-800 dark:text-white text-lg">₹{Math.round(group.totalEarned)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Pending</p>
                                    <p className="font-bold text-amber-500 text-lg">₹{Math.round(group.pendingSettlement)}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/50">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">{group.role}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{group.totalMembers} Members</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {groups.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                            You have not joined any work groups yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PersonalDashboard;
