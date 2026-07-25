import React, { useState } from 'react';
import { Users, ClipboardList, IndianRupee, LayoutDashboard, FileText } from 'lucide-react';

import AdminOverview from './AdminOverview';
import Members from './Members';
import WorkHistory from './WorkHistory';
import SettlementManagement from './SettlementManagement';
import Reports from './Reports';

const AdminDashboard = ({ group, analytics, records, isOwner, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Group Overview', icon: LayoutDashboard },
        { id: 'members', label: 'Members', icon: Users },
        { id: 'work', label: 'Work History', icon: ClipboardList },
        { id: 'settlements', label: 'Settlements', icon: IndianRupee },
        { id: 'reports', label: 'Reports', icon: FileText },
    ];

    return (
        <div>
            {/* Tabs */}
            <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl">
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
                {activeTab === 'overview' && (
                    <AdminOverview 
                        analytics={analytics} 
                        group={group} 
                        isOwner={isOwner} 
                        onUpdate={onUpdate} 
                    />
                )}
                {activeTab === 'members' && (
                    <Members 
                        group={group} 
                        onUpdate={onUpdate} 
                        isOwner={isOwner} 
                    />
                )}
                {activeTab === 'work' && (
                    <WorkHistory 
                        records={records} 
                        group={group} 
                        onUpdate={onUpdate} 
                    />
                )}
                {activeTab === 'settlements' && (
                    <SettlementManagement 
                        records={records} 
                        group={group} 
                        onUpdate={onUpdate} 
                    />
                )}
                {activeTab === 'reports' && (
                    <Reports 
                        records={records} 
                        group={group} 
                    />
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
