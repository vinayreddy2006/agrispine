import React, { useState } from 'react';
import { format } from 'date-fns';
import { MapPin, IndianRupee } from 'lucide-react';
import Card from '../../../components/ui/Card';
import WorkHistoryDetailsModal from '../components/WorkHistoryDetailsModal';

const MyHistory = ({ records, currentUserMember, group }) => {
    const [selectedRecord, setSelectedRecord] = useState(null);

    // Filter to only records where this member was present
    const myRecords = records.filter(r => r.attendance.includes(currentUserMember?._id));

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">My Work History</h3>
            
            {myRecords.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    No work history found for you in this group.
                </div>
            ) : (
                <div className="grid gap-4">
                    {myRecords.map(record => {
                        const isSettled = record.settledMembers?.includes(currentUserMember?._id);
                        
                        return (
                            <Card 
                                key={record._id} 
                                onClick={() => setSelectedRecord(record)}
                                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-transparent hover:border-l-green-500 transition-all cursor-pointer hover:shadow-md"
                            >
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-bold text-lg text-slate-800 dark:text-white">{format(new Date(record.date), 'dd MMM yyyy')}</span>
                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${isSettled ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {isSettled ? 'PAID' : 'PENDING'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {record.landOwnerName}'s Farm</span>
                                        <span>•</span>
                                        <span className="font-medium text-green-600 dark:text-green-400">{record.activityType} ({record.crop})</span>
                                        <span>•</span>
                                        <span>Group Size: {record.attendance.length}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-500 mb-1">My Earning</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center justify-end">
                                        <IndianRupee className="w-5 h-5" /> {Math.round(record.wagePerPerson)}
                                    </p>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {selectedRecord && (
                <WorkHistoryDetailsModal 
                    record={selectedRecord} 
                    group={group} 
                    onClose={() => setSelectedRecord(null)} 
                />
            )}
        </div>
    );
};

export default MyHistory;
