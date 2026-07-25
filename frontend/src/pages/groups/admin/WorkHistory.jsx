import React, { useState } from 'react';
import { format } from 'date-fns';
import { Plus, MapPin, IndianRupee, Download, List, TableProperties, CheckCircle2, X } from 'lucide-react';
import Card from '../../../components/ui/Card';
import RecordWorkModal from './RecordWorkModal';
import { exportToPDF, exportToExcel } from '../../../utils/ReportExport';

const WorkHistory = ({ records, group, onUpdate }) => {
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'table'
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

    const activeMembers = group.members.filter(m => m.status !== 'removed');
    const displayRecords = records;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Work History</h3>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-green-600' : 'text-slate-500 hover:text-slate-700'}`}
                            title="List View"
                        >
                            <List className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-green-600' : 'text-slate-500 hover:text-slate-700'}`}
                            title="Table View"
                        >
                            <TableProperties className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => exportToPDF(displayRecords, group.name)}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center gap-2 transition-colors flex-1 sm:flex-none justify-center"
                    >
                        <Download className="w-5 h-5" /> PDF
                    </button>
                    {group.status !== 'closed' && (
                        <button
                            onClick={() => setIsRecordModalOpen(true)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors flex-1 sm:flex-none justify-center"
                        >
                            <Plus className="w-5 h-5" /> Record Work
                        </button>
                    )}
                </div>
            </div>

            {records.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    No work records found. Click "Record Work" to log a day.
                </div>
            ) : viewMode === 'list' ? (
                <div className="grid gap-4">
                    {displayRecords.map(record => (
                        <Card key={record._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="font-bold text-lg text-slate-800 dark:text-white">{format(new Date(record.date), 'dd MMM yyyy')}</span>
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${record.paymentStatus === 'SETTLED' ? 'bg-green-100 text-green-700' : record.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                        {record.paymentStatus}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {record.landOwnerName}'s Farm</span>
                                    <span>•</span>
                                    <span className="font-medium text-green-600 dark:text-green-400">{record.activityType} ({record.crop})</span>
                                    <span>•</span>
                                    <span>{record.acres} Acres @ ₹{record.ratePerAcre}/Acre</span>
                                    <span>•</span>
                                    <span>{record.attendance.length} Workers</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-500 mb-1">Total Payment</p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white flex items-center justify-end">
                                    <IndianRupee className="w-5 h-5" /> {record.totalAmount}
                                </p>
                                <p className="text-xs text-green-600 font-medium">₹{Math.round(record.wagePerPerson)} / person</p>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-4 py-3 min-w-[150px] sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 shadow-[1px_0_0_0_#e2e8f0] dark:shadow-[1px_0_0_0_#334155]">Member Name</th>
                                    {records.map(record => (
                                        <th key={record._id} className="px-4 py-3 min-w-[120px] text-center border-l border-slate-200 dark:border-slate-700">
                                            <div className="font-bold text-slate-800 dark:text-white whitespace-nowrap">{format(new Date(record.date), 'dd MMM')}</div>
                                            <div className="text-xs text-slate-500 font-normal truncate max-w-[120px]">{record.landOwnerName}</div>
                                            <div className="text-xs text-green-600 font-normal">₹{Math.round(record.wagePerPerson)}</div>
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 min-w-[100px] text-center border-l border-slate-200 dark:border-slate-700 text-green-600 font-bold">Total Earned</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {activeMembers.map(member => {
                                    let memberTotal = 0;
                                    return (
                                        <tr key={member._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-800 dark:text-white sticky left-0 bg-white dark:bg-[#1e293b] z-10 shadow-[1px_0_0_0_#e2e8f0] dark:shadow-[1px_0_0_0_#334155]">
                                                {member.name}
                                            </td>
                                            {records.map(record => {
                                                const isPresent = record.attendance.includes(member._id);
                                                if (isPresent) memberTotal += record.wagePerPerson;
                                                return (
                                                    <td key={record._id} className="px-4 py-3 text-center border-l border-slate-100 dark:border-slate-700/50">
                                                        {isPresent ? (
                                                            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                                                        ) : (
                                                            <X className="w-5 h-5 text-slate-300 dark:text-slate-600 mx-auto" />
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-4 py-3 text-center font-bold text-green-600 border-l border-slate-200 dark:border-slate-700">
                                                ₹{Math.round(memberTotal)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {isRecordModalOpen && (
                <RecordWorkModal 
                    group={group} 
                    onClose={() => setIsRecordModalOpen(false)} 
                    onSuccess={() => {
                        setIsRecordModalOpen(false);
                        onUpdate();
                    }} 
                />
            )}
        </div>
    );
};

export default WorkHistory;
