import React, { useState, useEffect } from 'react';
import { IndianRupee, CheckCircle2, Calculator, CheckSquare, Square, History, Plus } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Swal from 'sweetalert2';
import { processSettlement } from '../../../api/groupService';

const SettlementManagement = ({ records, group, onUpdate, currentUserMemberId }) => {
    const [loading, setLoading] = useState(false);
    const [viewTab, setViewTab] = useState(group.status === 'closed' ? 'history' : 'new'); 
    
    const pendingRecords = records.filter(r => r.paymentStatus !== 'SETTLED');
    const completedRecords = records.filter(r => r.paymentStatus === 'SETTLED');
    const [selectedRecords, setSelectedRecords] = useState([]);
    
    const [selectedMembers, setSelectedMembers] = useState({});

    useEffect(() => {
        if (viewTab === 'new') {
            setSelectedRecords(pendingRecords.map(r => r._id));
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
        let memberEarned = {};
        let memberOwed = {};
        
        const activeRecords = pendingRecords.filter(r => selectedRecords.includes(r._id));
        activeRecords.forEach(r => {
            const settledIds = (r.settledMembers || []);
            
            // Handle internal farm owner
            if (r.isInternalFarm && r.internalMemberId) {
                let ownerOwesThisRecord = 0;
                r.attendance.forEach(memberId => {
                    if (!settledIds.includes(memberId) && memberId !== r.internalMemberId) {
                        ownerOwesThisRecord += r.wagePerPerson;
                    }
                });
                
                if (ownerOwesThisRecord > 0) {
                    if (!memberOwed[r.internalMemberId]) memberOwed[r.internalMemberId] = 0;
                    memberOwed[r.internalMemberId] += ownerOwesThisRecord;
                }
            }

            r.attendance.forEach(memberId => {
                if (!settledIds.includes(memberId)) {
                    if (!memberEarned[memberId]) memberEarned[memberId] = 0;
                    memberEarned[memberId] += r.wagePerPerson;
                }
            });
        });
        
        let netBalances = {};
        const allMemberIds = [...new Set([...Object.keys(memberEarned), ...Object.keys(memberOwed)])];
        
        allMemberIds.forEach(id => {
            const earned = memberEarned[id] || 0;
            const owed = memberOwed[id] || 0;
            const net = earned - owed;
            netBalances[id] = { earned, owed, net };
        });
        
        return { netBalances, activeRecords };
    };
    
    const preview = calculatePreview();

    // Auto-select all members in the current preview if not explicitly toggled off
    useEffect(() => {
        const newSelectedMembers = { ...selectedMembers };
        let changed = false;
        Object.keys(preview.netBalances).forEach(memberId => {
            if (newSelectedMembers[memberId] === undefined) {
                newSelectedMembers[memberId] = true;
                changed = true;
            }
        });
        if (changed) {
            setSelectedMembers(newSelectedMembers);
        }
    }, [preview.netBalances]);

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

        const activeDistributions = Object.keys(preview.netBalances)
            .filter(memberId => selectedMembers[memberId])
            .map(memberId => ({
                memberId,
                amountPaid: preview.netBalances[memberId].net
            }));

        if (activeDistributions.length === 0) {
            Swal.fire('Warning', 'Select at least one member to settle.', 'warning');
            return;
        }

        // The absolute total transaction volume (for analytics/display)
        const absoluteTransactionVolume = activeDistributions.reduce((acc, curr) => acc + Math.abs(curr.amountPaid), 0);
        
        const payload = {
            settlementType: activeDistributions.length === Object.keys(preview.netBalances).length ? 'GROUP_WIDE' : 'NET_SETTLEMENT',
            totalAmount: absoluteTransactionVolume,
            workRecordsIncluded: selectedRecords,
            distributions: activeDistributions,
            notes: 'Net Settlement Processed',
            paymentMode,
            remarks
        };
        
        const confirm = await Swal.fire({
            title: 'Confirm Net Settlement',
            text: `Are you sure you want to process this settlement for ${activeDistributions.length} members?`,
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

    // Calculate total money admin has to pay out (net > 0) and total admin receives (net < 0)
    const adminPaysOut = Object.keys(preview.netBalances)
        .filter(id => selectedMembers[id] && preview.netBalances[id].net > 0)
        .reduce((acc, curr) => acc + preview.netBalances[curr].net, 0);

    const adminReceives = Object.keys(preview.netBalances)
        .filter(id => selectedMembers[id] && preview.netBalances[id].net < 0)
        .reduce((acc, curr) => acc + Math.abs(preview.netBalances[curr].net), 0);

    return (
        <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
                {group.status !== 'closed' && (
                    <button
                        onClick={() => setViewTab('new')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewTab === 'new' ? 'bg-white dark:bg-slate-700 text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        New Settlement
                    </button>
                )}
                <button
                    onClick={() => setViewTab('history')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewTab === 'history' ? 'bg-white dark:bg-slate-700 text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Settlement History
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
                                                {record.isInternalFarm && <span className="ml-2 text-indigo-500 font-bold bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 rounded text-xs">INTERNAL FARM</span>}
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
                    <div className="w-full lg:w-[450px]">
                        <Card className="p-6 sticky top-24 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                                <Calculator className="w-6 h-6 text-green-600" />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Net Settlement Preview</h3>
                            </div>
                            
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Selected Records</span>
                                    <span className="font-bold text-slate-800 dark:text-white">{selectedRecords.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Total Payouts (Admin Pays)</span>
                                    <span className="font-bold text-green-600">₹{Math.round(adminPaysOut)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Total Receivables (Admin Receives)</span>
                                    <span className="font-bold text-indigo-600">₹{Math.round(adminReceives)}</span>
                                </div>
                            </div>

                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mb-6">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Line-by-Line Breakdown</p>
                                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                                    {Object.keys(preview.netBalances).map(memberId => {
                                        const memberName = group.members.find(m => m._id === memberId)?.name || 'Unknown';
                                        const isSelected = selectedMembers[memberId] !== false;
                                        const { earned, owed, net } = preview.netBalances[memberId];
                                        
                                        return (
                                            <div 
                                                key={memberId} 
                                                onClick={() => handleToggleMember(memberId)}
                                                className={`cursor-pointer p-3 rounded-xl border ${isSelected ? 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm' : 'border-dashed border-slate-200 opacity-60'}`}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    {isSelected ? <CheckSquare className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4 text-slate-400" />}
                                                    <span className="font-bold text-slate-800 dark:text-white text-sm">{memberName}</span>
                                                </div>
                                                <div className="pl-6 space-y-1 text-xs">
                                                    {earned > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Earned (Worked for others)</span>
                                                            <span className="font-medium text-green-600">+₹{Math.round(earned)}</span>
                                                        </div>
                                                    )}
                                                    {owed > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Owed (Others worked on own farm)</span>
                                                            <span className="font-medium text-red-500">-₹{Math.round(owed)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-700 mt-1">
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">Final Balance</span>
                                                        {net > 0 ? (
                                                            <span className="font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 rounded">To Receive: ₹{Math.round(net)}</span>
                                                        ) : net < 0 ? (
                                                            <span className="font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 px-2 rounded">To Pay: ₹{Math.round(Math.abs(net))}</span>
                                                        ) : (
                                                            <span className="font-bold text-slate-500">Settled (₹0)</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {Object.keys(preview.netBalances).length === 0 && (
                                        <p className="text-sm text-slate-400 italic text-center py-4">No pending balances for selected records.</p>
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
                                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
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
                                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleProcess}
                                disabled={loading || selectedRecords.length === 0 || Object.keys(preview.netBalances).length === 0}
                                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Process Net Settlement'}
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

export default SettlementManagement;
