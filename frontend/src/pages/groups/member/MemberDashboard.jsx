import React from 'react';
import { format } from 'date-fns';
import { ClipboardList, IndianRupee, LayoutDashboard, Users, Bell, Briefcase, ChevronRight, User } from 'lucide-react';

import MyStats from './MyStats';
import MyHistory from './MyHistory';
import MySettlements from './MySettlements';
import Card from '../../../components/ui/Card';

const MemberDashboard = ({ group, analytics, records, currentUserMember, isAdmin, isOwner }) => {
    if (!currentUserMember && !isAdmin && !isOwner) {
        return (
            <div className="text-center py-12 text-slate-500">
                You are not currently a member of this group.
            </div>
        );
    }

    const activeMembers = group.members.filter(m => m.status !== 'removed');

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* 1. My Stats Section (Contains Group Info + Personal Stats) */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <LayoutDashboard className="w-5 h-5 text-green-600 dark:text-green-500" />
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-wider">Dashboard Overview</h2>
                </div>
                <MyStats 
                    group={group} 
                    analytics={analytics} 
                    currentUserMember={currentUserMember}
                />
            </section>

            {/* 2. Group Members Section */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-500" />
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-wider">Group Members</h2>
                </div>
                <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar">
                    {activeMembers.map(member => {
                        const isMemberAdmin = member.role === 'admin' || member.role === 'owner';
                        return (
                            <Card key={member._id} className="min-w-[200px] flex-shrink-0 p-4 border border-slate-200/60 dark:border-slate-800/60 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="Online" />
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm flex items-center justify-center mb-3">
                                        <User className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 dark:text-white truncate w-full">{member.name}</h3>
                                    <p className={`text-xs font-semibold px-2 py-1 mt-2 rounded-md ${isMemberAdmin ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-2">
                                        Joined {format(new Date(member.joinedAt || Date.now()), 'MMM yyyy')}
                                    </p>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </section>

            {/* 3. Layout Grid for Activity & Upcoming */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Announcements */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-green-600 dark:text-green-500" />
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-wider">Announcements</h2>
                        </div>
                    </div>
                    <Card className="p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-800/30 min-h-[200px]">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                            <Bell className="w-6 h-6 text-blue-500" />
                        </div>
                        <h3 className="text-slate-800 dark:text-white font-bold mb-1">No Recent Announcements</h3>
                        <p className="text-sm text-slate-500 max-w-[200px]">Group admins haven't posted any updates recently.</p>
                    </Card>
                </section>

                {/* Upcoming Work */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-green-600 dark:text-green-500" />
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-wider">Upcoming Work</h2>
                        </div>
                    </div>
                    <Card className="p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-800/30 min-h-[200px]">
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                            <Briefcase className="w-6 h-6 text-green-500" />
                        </div>
                        <h3 className="text-slate-800 dark:text-white font-bold mb-1">No Assigned Work</h3>
                        <p className="text-sm text-slate-500 max-w-[200px]">You have no scheduled work for the upcoming days.</p>
                    </Card>
                </section>

            </div>

            {/* 4. Work History & Settlements */}
            <div className="grid grid-cols-1 gap-8 mt-8 border-t border-slate-200 dark:border-slate-800 pt-8">
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <ClipboardList className="w-5 h-5 text-green-600 dark:text-green-500" />
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-wider">Work Records</h2>
                    </div>
                    <MyHistory 
                        records={records} 
                        currentUserMember={currentUserMember}
                        group={group}
                    />
                </section>

                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <IndianRupee className="w-5 h-5 text-green-600 dark:text-green-500" />
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-wider">Settlements</h2>
                    </div>
                    <MySettlements 
                        records={records} 
                        currentUserMember={currentUserMember}
                    />
                </section>
            </div>

        </div>
    );
};

export default MemberDashboard;
