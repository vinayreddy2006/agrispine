import React from 'react';
import { format } from 'date-fns';
import { MapPin, IndianRupee, Users, Leaf, Calendar, X, Clock, FileText, Pickaxe } from 'lucide-react';
import Card from '../../../components/ui/Card';

const WorkHistoryDetailsModal = ({ record, group, onClose }) => {
    if (!record) return null;

    // Helper to find member name
    const getMemberName = (id) => {
        const member = group.members.find(m => m._id === id);
        return member ? member.name : 'Unknown Member';
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-600 dark:text-green-500" />
                        Work Record Details
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    
                    {/* Status Banner */}
                    <div className={`p-4 rounded-2xl border flex items-center justify-between ${record.paymentStatus === 'SETTLED' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400' : record.paymentStatus === 'PARTIAL' ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-900/50 dark:text-amber-400' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400'}`}>
                        <div className="flex items-center gap-2 font-bold text-lg">
                            <Clock className="w-5 h-5" />
                            {record.paymentStatus === 'SETTLED' ? 'Fully Settled' : record.paymentStatus === 'PARTIAL' ? 'Partially Settled' : 'Payment Pending'}
                        </div>
                        <div className="text-sm font-medium opacity-80">
                            Logged on {format(new Date(record.createdAt || record.date), 'dd MMM yyyy, p')}
                        </div>
                    </div>

                    {/* Core Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-5 shadow-sm border-slate-200/60 dark:border-slate-800/60">
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                                <MapPin className="w-4 h-4" /> Farm Details
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-slate-500">Farm Owner</p>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{record.landOwnerName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Village/Location</p>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{group.village || 'N/A'}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-5 shadow-sm border-slate-200/60 dark:border-slate-800/60">
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                                <Pickaxe className="w-4 h-4" /> Activity Details
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-slate-500">Work Type</p>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{record.activityType}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Crop</p>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                        <Leaf className="w-3 h-3 text-green-500" /> {record.crop}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Date of Work</p>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-blue-500" /> {format(new Date(record.date), 'dd MMMM yyyy')}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Financial Summary */}
                    <Card className="p-5 shadow-sm border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-800/30">
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                            <IndianRupee className="w-4 h-4" /> Financial Summary
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-slate-500">Acres Worked</p>
                                <p className="font-bold text-lg text-slate-800 dark:text-slate-200">{record.acres}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Rate / Acre</p>
                                <p className="font-bold text-lg text-slate-800 dark:text-slate-200">₹{record.ratePerAcre}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Additional</p>
                                <p className="font-bold text-lg text-slate-800 dark:text-slate-200">₹{record.additionalCharges || 0}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Total Group Earning</p>
                                <p className="font-bold text-2xl text-green-600 dark:text-green-500">₹{record.totalAmount}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Workers Attendance */}
                    <Card className="p-5 shadow-sm border-slate-200/60 dark:border-slate-800/60">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 uppercase tracking-wider">
                                <Users className="w-4 h-4" /> Worker Attendance ({record.attendance.length})
                            </h3>
                            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-lg text-sm font-bold">
                                ₹{Math.round(record.wagePerPerson)} / person
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {record.attendance.map(memberId => {
                                const isSettled = record.settledMembers?.includes(memberId);
                                return (
                                    <div key={memberId} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                                        <span className="font-medium text-slate-800 dark:text-slate-200">
                                            {getMemberName(memberId)}
                                        </span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${isSettled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                            {isSettled ? 'PAID' : 'PENDING'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
};

export default WorkHistoryDetailsModal;
