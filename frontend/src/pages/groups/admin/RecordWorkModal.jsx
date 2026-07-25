import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Swal from 'sweetalert2';
import { createWorkRecord } from '../../../api/groupService';

const RecordWorkModal = ({ group, onClose, onSuccess }) => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        landOwnerName: '',
        crop: '',
        activityType: '',
        acres: '',
        ratePerAcre: '',
        additionalCharges: 0,
        attendance: [] // Array of member IDs
    });
    const [loading, setLoading] = useState(false);

    const toggleAttendance = (memberId) => {
        setFormData(prev => {
            const isAttending = prev.attendance.includes(memberId);
            return {
                ...prev,
                attendance: isAttending 
                    ? prev.attendance.filter(id => id !== memberId)
                    : [...prev.attendance, memberId]
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.attendance.length === 0) {
            Swal.fire('Error', 'Please select at least one member for attendance.', 'error');
            return;
        }
        setLoading(true);
        try {
            await createWorkRecord(group._id, formData);
            onSuccess();
        } catch (error) {
            console.error("Failed to record work", error);
            Swal.fire('Error', 'Failed to record work.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="sticky top-0 bg-white dark:bg-slate-900 z-10 flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Record Daily Work</h2>
                    <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                            <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Land Owner Name</label>
                            <input type="text" required value={formData.landOwnerName} onChange={e => setFormData({...formData, landOwnerName: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" placeholder="e.g. Ramesh" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Crop</label>
                            <input type="text" required value={formData.crop} onChange={e => setFormData({...formData, crop: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" placeholder="e.g. Cotton" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Activity</label>
                            <input type="text" required value={formData.activityType} onChange={e => setFormData({...formData, activityType: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" placeholder="e.g. Sowing" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Acres</label>
                            <input type="number" step="0.1" required value={formData.acres} onChange={e => setFormData({...formData, acres: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rate Per Acre (₹)</label>
                            <input type="number" required value={formData.ratePerAcre} onChange={e => setFormData({...formData, ratePerAcre: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Additional Charges (₹) (Optional)</label>
                            <input type="number" value={formData.additionalCharges} onChange={e => setFormData({...formData, additionalCharges: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" placeholder="e.g. Tractor charge" />
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-3">Attendance</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {group.members.map(member => (
                                <div 
                                    key={member._id}
                                    onClick={() => toggleAttendance(member._id)}
                                    className={`p-3 rounded-xl border-2 cursor-pointer transition-colors flex items-center gap-3 ${formData.attendance.includes(member._id) ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-70 hover:opacity-100'}`}
                                >
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${formData.attendance.includes(member._id) ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                        {formData.attendance.includes(member._id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                    <span className="font-medium text-slate-800 dark:text-white text-sm truncate">{member.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <div>
                            <p className="text-sm text-slate-500">Total Calculated</p>
                            <p className="text-xl font-bold text-slate-800 dark:text-white">₹{((Number(formData.acres) * Number(formData.ratePerAcre)) + Number(formData.additionalCharges)).toFixed(2)}</p>
                        </div>
                        <button type="submit" disabled={loading} className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save Record'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecordWorkModal;
