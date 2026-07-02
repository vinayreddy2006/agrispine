import React, { useState } from 'react';
import Card from '../../../components/ui/Card';
import { IndianRupee, Users, Layout, Clock, ShieldAlert } from 'lucide-react';
import Swal from 'sweetalert2';
import { closeGroup } from '../../../api/groupService';

const OverviewTab = ({ analytics, group, isOwner, onUpdate }) => {
    const [closing, setClosing] = useState(false);

    const handleCloseGroup = async () => {
        const confirm = await Swal.fire({
            title: 'Close Group?',
            text: 'This will freeze all group activities. It cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, close it!'
        });

        if (confirm.isConfirmed) {
            setClosing(true);
            try {
                await closeGroup(group._id);
                Swal.fire('Closed!', 'Group has been closed successfully.', 'success');
                onUpdate();
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'Failed to close group.', 'error');
            } finally {
                setClosing(false);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white border-none">
                    <IndianRupee className="w-8 h-8 opacity-50 mb-4" />
                    <p className="text-green-100 text-sm font-medium">Total Earned</p>
                    <h3 className="text-2xl font-bold">₹{analytics.totalEarnings}</h3>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white border-none">
                    <Clock className="w-8 h-8 opacity-50 mb-4" />
                    <p className="text-amber-100 text-sm font-medium">Pending Payments</p>
                    <h3 className="text-2xl font-bold">₹{analytics.pendingPayments}</h3>
                </Card>
                <Card className="p-6 bg-slate-50 dark:bg-slate-800">
                    <Layout className="w-8 h-8 text-blue-500 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Acres Worked</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{analytics.totalAcres}</h3>
                </Card>
                <Card className="p-6 bg-slate-50 dark:bg-slate-800">
                    <Users className="w-8 h-8 text-purple-500 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Work Days</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{analytics.totalWorkDays}</h3>
                </Card>
            </div>

            <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-4">Member Contributions</h3>
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">Member</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">Days Worked</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">Total Earned</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-400">Pending</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {group.members.map(member => {
                                const stats = analytics.memberStats[member._id] || { daysWorked: 0, earned: 0, pending: 0 };
                                return (
                                    <tr key={member._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="p-4 font-medium text-slate-800 dark:text-white">{member.name}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300">{stats.daysWorked}</td>
                                        <td className="p-4 text-green-600 font-medium">₹{Math.round(stats.earned)}</td>
                                        <td className="p-4 text-amber-600 font-medium">₹{Math.round(stats.pending)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {isOwner && group.status !== 'closed' && (
                <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-xl text-red-600 dark:text-red-400">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-bold text-red-800 dark:text-red-400">Danger Zone</h4>
                                <p className="text-red-600 dark:text-red-300 mt-1 mb-4 text-sm">
                                    Closing this group will prevent any further work records, member changes, or new settlements. 
                                    You should only do this at the end of the season.
                                </p>
                                <button 
                                    onClick={handleCloseGroup}
                                    disabled={closing}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {closing ? 'Closing...' : 'Close Group'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OverviewTab;
