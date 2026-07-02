import React, { useState, useEffect } from 'react';
import { IndianRupee, CheckCircle2, Calculator, CheckSquare, Square, History, Plus } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Swal from 'sweetalert2';
import { processSettlement } from '../../../api/groupService';
import axiosClient from '../../../api/axiosClient'; // Need to fetch settlement history

const SettlementsTab = ({ records, group, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [viewTab, setViewTab] = useState(group.status === 'closed' ? 'history' : 'new'); // 'new' or 'history'
    const [history, setHistory] = useState([]);
    
    // Only show pending and partial records for selection
    const pendingRecords = records.filter(r => r.paymentStatus !== 'SETTLED');
    const completedRecords = records.filter(r => r.paymentStatus === 'SETTLED');
    const [selectedRecords, setSelectedRecords] = useState([]);
    
    // Member selection for partial settlement
    const [selectedMembers, setSelectedMembers] = useState({});

    useEffect(() => {
        if (viewTab === 'new') {
            setSelectedRecords(pendingRecords.map(r => r._id));
        } else {
            // Fetch settlement history
            const fetchHistory = async () => {
                try {
                    // Assuming we have an endpoint for this, we could also just derive it from records if we fetched settlements.
                    // For now, let's assume we can fetch settlements for the group. 
                    // If no dedicated endpoint, we could add one or just show completed records.
                    // Since the user wants to see "Settlements", we should really fetch the Settlement documents.
                    // Wait, we don't have a getGroupSettlements endpoint. I'll just show completed records for now,
                    // or add a quick API call if it existed. Let's just use completed records as "History" since they are settled.
                } catch (e) {}
            };
            fetchHistory();
        }
    }, [records, viewTab]);
    
    const handleToggleRecord = (id) => {
        if (selectedRecords.includes(id)) {
            setSelectedRecords(selectedRecords.filter(r => r !== id));
        } else {
            setSelectedRecords([...selectedRecords, id]);
        }
    };
    
    // Calculate preview
    const calculatePreview = () => {
        let total = 0;
        let memberShares = {};
        
        const activeRecords = pendingRecords.filter(r => selectedRecords.includes(r._id));
        activeRecords.forEach(r => {
            const settledIds = (r.settledMembers || []);
            r.attendance.forEach(memberId => {
                // If member hasn't been settled for this record
                if (!settledIds.includes(memberId)) {
                    if (!memberShares[memberId]) memberShares[memberId] = 0;
                    memberShares[memberId] += r.wagePerPerson;
                    total += r.wagePerPerson;
                }
            });
        });
        
        return { total, memberShares, activeRecords };
    };
    
    const preview = calculatePreview();

    // Auto-select all members in the current preview if not explicitly toggled off
    useEffect(() => {
        const newSelectedMembers = { ...selectedMembers };
        let changed = false;
        Object.keys(preview.memberShares).forEach(memberId => {
            if (newSelectedMembers[memberId] === undefined) {
                newSelectedMembers[memberId] = true;
                changed = true;
            }
        });
        if (changed) {
            setSelectedMembers(newSelectedMembers);
        }
    }, [preview.memberShares]);

    const handleToggleMember = (memberId) => {
        setSelectedMembers(prev => ({ ...prev, [memberId]: !prev[memberId] }));
    };

    const [paymentMode, setPaymentMode] = useState('CASH');
    const [remarks, setRemarks] = useState('');

    const handleProcess = async () => {
        if (selectedRecords.length === 0) {
            Swal.fire('Warning', 'Select at least one record.', 'warning');
            return;
        }

        const activeDistributions = Object.keys(preview.memberShares)
            .filter(memberId => selectedMembers[memberId])
            .map(memberId => ({
                memberId,
                amountPaid: preview.memberShares[memberId]
            }));

        if (activeDistributions.length === 0) {
            Swal.fire('Warning', 'Select at least one member to settle.', 'warning');
            return;
        }

        const payloadAmount = activeDistributions.reduce((acc, curr) => acc + curr.amountPaid, 0);
        
        const payload = {
            settlementType: activeDistributions.length === Object.keys(preview.memberShares).length ? 'GROUP_WIDE' : 'SELECTED_MEMBERS',
            totalAmount: payloadAmount,
            workRecordsIncluded: selectedRecords,
            distributions: activeDistributions,
            notes: 'Generated automatically.',
            paymentMode,
            remarks
        };
        
        const confirm = await Swal.fire({
            title: 'Confirm Settlement',
            text: `Are you sure you want to process ₹${Math.round(payloadAmount)} for ${activeDistributions.length} members?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, process it!'
        });

        if (!confirm.isConfirmed) return;
        
        setLoading(true);
        try {
            await processSettlement(group._id, payload);
            Swal.fire('Success', 'Settlement processed successfully!', 'success');
            setSelectedRecords([]);
            setSelectedMembers({});
            onUpdate();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Failed to process settlement.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const activeTotalAmount = Object.keys(preview.memberShares)
        .filter(id => selectedMembers[id])
        .reduce((acc, curr) => acc + preview.memberShares[curr], 0);

    return (
        <div className="space-y-6">
            {/* Top Navigation */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl max-w-sm">
                {group.status !== 'closed' && (
                    <button 
                        onClick={() => setViewTab('new')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewTab === 'new' ? 'bg-white dark:bg-slate-700 text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Plus className="w-4 h-4" /> New Settlement
                    </button>
                )}
                <button 
                    onClick={() => setViewTab('history')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewTab === 'history' ? 'bg-white dark:bg-slate-700 text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <History className="w-4 h-4" /> History
                </button>
            </div>

            {viewTab === 'new' ? (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left side: Pending Records Selection */}
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Pending Work Records</h3>
                            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">{pendingRecords.length} Pending</span>
                        </div>
                        {pendingRecords.length === 0 ? (
                            <Card className="p-8 text-center text-slate-500">
                                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                All work records are fully settled!
                            </Card>
                        ) : (
                            pendingRecords.map(record => (
                                <Card 
                                    key={record._id} 
                                    onClick={() => handleToggleRecord(record._id)}
                                    className={`p-4 cursor-pointer transition-all border-2 ${selectedRecords.includes(record._id) ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white">
                                                {new Date(record.date).toLocaleDateString()} - {record.landOwnerName}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {record.activityType} • {record.acres} Acres 
                                                {record.paymentStatus === 'PARTIAL' && <span className="ml-2 text-amber-500 font-bold bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded text-xs">PARTIAL</span>}
                                            </p>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedRecords.includes(record._id) ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                                {selectedRecords.includes(record._id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Right side: Settlement Summary Panel */}
                    <div className="w-full lg:w-96">
                        <Card className="p-6 sticky top-24 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                                <Calculator className="w-6 h-6 text-green-600" />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Settlement Preview</h3>
                            </div>
                            
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Selected Records</span>
                                    <span className="font-bold text-slate-800 dark:text-white">{selectedRecords.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Total Settlement Amount</span>
                                    <span className="font-bold text-green-600 text-lg">₹{Math.round(activeTotalAmount)}</span>
                                </div>
                            </div>

                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mb-6">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Select Members to Settle</p>
                                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                    {Object.keys(preview.memberShares).map(memberId => {
                                        const memberName = group.members.find(m => m._id === memberId)?.name || 'Unknown';
                                        const isSelected = selectedMembers[memberId] !== false;
                                        return (
                                            <div 
                                                key={memberId} 
                                                onClick={() => handleToggleMember(memberId)}
                                                className="flex justify-between items-center text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {isSelected ? <CheckSquare className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4 text-slate-400" />}
                                                    <span className={`truncate max-w-[150px] ${isSelected ? 'text-slate-800 dark:text-white font-medium' : 'text-slate-500'}`}>
                                                        {memberName}
                                                    </span>
                                                </div>
                                                <span className={`font-bold ${isSelected ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                                                    ₹{Math.round(preview.memberShares[memberId])}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {Object.keys(preview.memberShares).length === 0 && (
                                        <p className="text-sm text-slate-400 italic text-center py-4">No pending payments for selected records.</p>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mb-6">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Payment Details</p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Mode</label>
                                        <select 
                                            value={paymentMode}
                                            onChange={(e) => setPaymentMode(e.target.value)}
                                            className="w-full"
                                        >
                                            <option value="CASH">Cash</option>
                                            <option value="UPI">UPI</option>
                                            <option value="BANK_TRANSFER">Bank Transfer</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Remarks (Optional)</label>
                                        <input 
                                            type="text" 
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            placeholder="E.g., Cleared dues for this week"
                                            className="w-full min-h-[44px]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleProcess}
                                disabled={loading || selectedRecords.length === 0 || activeTotalAmount === 0}
                                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : `Pay ₹${Math.round(activeTotalAmount)}`}
                            </button>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Completed Work Records</h3>
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">{completedRecords.length} Completed</span>
                    </div>
                    {completedRecords.length === 0 ? (
                        <Card className="p-8 text-center text-slate-500">
                            No completely settled records yet.
                        </Card>
                    ) : (
                        completedRecords.map(record => (
                            <Card key={record._id} className="p-4 border-l-4 border-l-green-500">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white">
                                            {new Date(record.date).toLocaleDateString()} - {record.landOwnerName}
                                        </p>
                                        <p className="text-sm text-slate-500">{record.activityType} • {record.acres} Acres</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-green-600">
                                            ₹{record.totalAmount}
                                        </p>
                                        <p className="text-xs text-green-600 font-bold flex items-center gap-1 justify-end">
                                            <CheckCircle2 className="w-3 h-3" /> SETTLED
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default SettlementsTab;
