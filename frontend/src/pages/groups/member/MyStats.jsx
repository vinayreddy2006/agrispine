import React from 'react';
import Card from '../../../components/ui/Card';
import { IndianRupee, Clock, Layout } from 'lucide-react';

const MyStats = ({ group, analytics, currentUserMember }) => {
    
    // Calculate personal stats
    const memberId = currentUserMember?._id;
    const personalStats = analytics?.memberStats?.[memberId] || { daysWorked: 0, earned: 0, pending: 0 };
    
    const totalDays = analytics?.totalWorkDays || 0;
    const attendancePercentage = totalDays > 0 ? ((personalStats.daysWorked / totalDays) * 100).toFixed(1) : 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 border-none text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-green-100 font-medium mb-1">Total Earned (This Group)</p>
                            <h3 className="text-3xl font-bold flex items-center">
                                <IndianRupee className="w-6 h-6 mr-1" /> {Math.round(personalStats.earned)}
                            </h3>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl">
                            <IndianRupee className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/30">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-amber-600 dark:text-amber-400 font-medium mb-1">Pending Payment</p>
                            <h3 className="text-3xl font-bold text-amber-700 dark:text-amber-300 flex items-center">
                                <IndianRupee className="w-6 h-6 mr-1" /> {Math.round(personalStats.pending)}
                            </h3>
                        </div>
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
                            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 font-medium mb-1">Days Worked</p>
                            <h3 className="text-3xl font-bold text-slate-800 dark:text-white flex items-baseline gap-2">
                                {personalStats.daysWorked} <span className="text-sm font-normal text-slate-500">/ {totalDays}</span>
                            </h3>
                            <p className="text-sm text-green-600 mt-2 font-medium">{attendancePercentage}% Attendance</p>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                            <Layout className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="p-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Group Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Group Name</p>
                        <p className="font-bold text-slate-800 dark:text-white">{group.name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Village</p>
                        <p className="font-bold text-slate-800 dark:text-white">{group.village || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Total Members</p>
                        <p className="font-bold text-slate-800 dark:text-white">
                            {group.members.filter(m => m.status !== 'removed').length} Active
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Season Status</p>
                        <p className={`font-bold ${group.status === 'closed' ? 'text-red-500' : 'text-green-500'}`}>
                            {group.status === 'closed' ? 'Closed' : 'Active'}
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default MyStats;
