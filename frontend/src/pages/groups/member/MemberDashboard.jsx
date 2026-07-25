import React, { useState } from 'react';
import { ClipboardList, IndianRupee, LayoutDashboard } from 'lucide-react';

import MyStats from './MyStats';
import MyHistory from './MyHistory';
import MySettlements from './MySettlements';

const MemberDashboard = ({ group, analytics, records, currentUserMember, isAdmin, isOwner }) => {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'My Stats', icon: LayoutDashboard },
        { id: 'work', label: 'My Work History', icon: ClipboardList },
        { id: 'settlements', label: 'My Settlements', icon: IndianRupee },
    ];

    if (!currentUserMember && !isAdmin && !isOwner) {
        return (
            <div className="text-center py-12 text-slate-500">
                You are not currently a member of this group.
            </div>
        );
    }

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
                    <MyStats 
                        group={group} 
                        analytics={analytics} 
                        currentUserMember={currentUserMember}
                    />
                )}
                {activeTab === 'work' && (
                    <MyHistory 
                        records={records} 
                        currentUserMember={currentUserMember}
                    />
                )}
                {activeTab === 'settlements' && (
                    <MySettlements 
                        records={records} 
                        currentUserMember={currentUserMember}
                    />
                )}
            </div>
        </div>
    );
};

export default MemberDashboard;
