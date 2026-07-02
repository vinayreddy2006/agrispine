import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, ClipboardList, IndianRupee, LayoutDashboard } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { getGroupById, getGroupAnalytics, getGroupWorkRecords } from '../../api/groupService';

import MembersTab from './components/MembersTab';
import WorkHistoryTab from './components/WorkHistoryTab';
import OverviewTab from './components/OverviewTab';
import SettlementsTab from './components/SettlementsTab';

const GroupDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [groupRes, analyticsRes, recordsRes] = await Promise.all([
                getGroupById(id),
                getGroupAnalytics(id),
                getGroupWorkRecords(id)
            ]);
            setGroup(groupRes.data.group);
            setAnalytics(analyticsRes.data.analytics);
            setRecords(recordsRes.data.records);
        } catch (error) {
            console.error("Error fetching group details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    if (loading || !group) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'members', label: 'Members', icon: Users },
        { id: 'work', label: 'Work History', icon: ClipboardList },
        { id: 'settlements', label: 'Settlements', icon: IndianRupee }
    ];

    return (
        <div className="pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <PageHeader title={group.name} subtitle={group.village || "Work Group"} />
            
            {/* Tabs */}
            <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 mt-4 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-1 justify-center
                            ${activeTab === tab.id 
                                ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="mt-6">
                {activeTab === 'overview' && <OverviewTab analytics={analytics} group={group} isOwner={group.createdBy === localStorage.getItem('userId')} onUpdate={fetchData} />}
                {activeTab === 'members' && <MembersTab group={group} onUpdate={fetchData} />}
                {activeTab === 'work' && <WorkHistoryTab records={records} group={group} onUpdate={fetchData} />}
                {activeTab === 'settlements' && <SettlementsTab records={records} group={group} onUpdate={fetchData} />}
            </div>
        </div>
    );
};

export default GroupDetails;
