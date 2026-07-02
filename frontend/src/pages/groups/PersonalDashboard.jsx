import React, { useState, useEffect } from 'react';
import { IndianRupee, Briefcase, CheckCircle2, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import { getPersonalDashboard } from '../../api/groupService';

const PersonalDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getPersonalDashboard();
                setStats(res.data.stats);
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
        <div className="pb-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <PageHeader title="My Work & Earnings" subtitle="Your personal farming contributions across all groups" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <Card className="p-8 bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-lg shadow-green-500/20 relative overflow-hidden">
                    <IndianRupee className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
                    <div className="relative z-10">
                        <p className="text-green-100 font-medium mb-2">Total Earned</p>
                        <h2 className="text-4xl font-bold">₹{Math.round(stats.totalEarned)}</h2>
                        <p className="text-sm text-green-100 mt-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> Lifetime earnings
                        </p>
                    </div>
                </Card>

                <Card className="p-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 relative overflow-hidden">
                    <CheckCircle2 className="absolute -right-4 -bottom-4 w-32 h-32 text-amber-500/10" />
                    <div className="relative z-10">
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">Pending Payments</p>
                        <h2 className="text-4xl font-bold text-amber-500">₹{Math.round(stats.pendingEarned)}</h2>
                        <p className="text-sm text-slate-500 mt-4">Awaiting settlement</p>
                    </div>
                </Card>

                <Card className="p-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 relative overflow-hidden">
                    <Briefcase className="absolute -right-4 -bottom-4 w-32 h-32 text-blue-500/10" />
                    <div className="relative z-10">
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">Days Worked</p>
                        <h2 className="text-4xl font-bold text-blue-500">{stats.daysWorked}</h2>
                        <p className="text-sm text-slate-500 mt-4">Across {stats.groupsCount} groups</p>
                    </div>
                </Card>
            </div>
            
            <div className="mt-8 text-center bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400">Detailed breakdown by crop and group will be available in future reports.</p>
            </div>
        </div>
    );
};

export default PersonalDashboard;
