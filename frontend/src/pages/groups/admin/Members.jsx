import React, { useState } from 'react';
import { Plus, UserX, Shield, ShieldAlert, Key, MoreVertical } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Swal from 'sweetalert2';
import { addGroupMember, updateMemberRole, removeGroupMember, transferOwnership } from '../../../api/groupService';

const Members = ({ group, onUpdate }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [village, setVillage] = useState('');
    const [loading, setLoading] = useState(false);
    
    const userStr = localStorage.getItem('user');
    const currentUserId = userStr ? JSON.parse(userStr).id : null;
    const currentUserRole = group.members.find(m => m.user === currentUserId)?.role || (group.createdBy === currentUserId ? 'owner' : 'member');
    const isAdmin = currentUserRole === 'admin' || currentUserRole === 'owner';
    const isOwner = currentUserRole === 'owner';

    const handleAddMember = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addGroupMember(group._id, { name, phone, village });
            Swal.fire('Success', 'Member added successfully', 'success');
            setName('');
            setPhone('');
            setVillage('');
            onUpdate();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to add member', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (memberId, newRole) => {
        try {
            await updateMemberRole(group._id, memberId, { role: newRole });
            Swal.fire('Success', `Role updated to ${newRole}`, 'success');
            onUpdate();
        } catch (error) {
            Swal.fire('Error', 'Failed to update role', 'error');
        }
    };

    const handleRemove = async (memberId) => {
        Swal.fire({
            title: 'Remove Member?',
            text: "They will be marked as inactive but their work history will be preserved.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, remove them!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await removeGroupMember(group._id, memberId);
                    Swal.fire('Removed!', 'Member has been removed.', 'success');
                    onUpdate();
                } catch (error) {
                    Swal.fire('Error', 'Failed to remove member.', 'error');
                }
            }
        });
    };

    const handleTransfer = async (memberId, memberUser) => {
        if (!memberUser) {
            return Swal.fire('Error', 'Cannot transfer ownership to an offline member.', 'error');
        }
        Swal.fire({
            title: 'Transfer Ownership?',
            text: "You will lose owner privileges and become an Admin.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, transfer!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await transferOwnership(group._id, { newOwnerId: memberUser });
                    Swal.fire('Transferred!', 'Ownership transferred successfully.', 'success');
                    onUpdate();
                } catch (error) {
                    Swal.fire('Error', 'Failed to transfer ownership.', 'error');
                }
            }
        });
    };

    const activeMembers = group.members.filter(m => m.status !== 'removed');

    return (
        <div className="space-y-6">
            {isAdmin && group.status !== 'closed' && (
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Add New Member</h3>
                    <form onSubmit={handleAddMember} className="flex gap-4 items-end flex-wrap">
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none focus:border-green-500"
                                placeholder="Member name"
                            />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none focus:border-green-500"
                                placeholder="Optional"
                            />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Village</label>
                            <input
                                type="text"
                                value={village}
                                onChange={(e) => setVillage(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none focus:border-green-500"
                                placeholder="Optional"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 h-[42px]"
                        >
                            <Plus className="w-5 h-5" /> Add
                        </button>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeMembers.map((member) => (
                    <Card key={member._id} className="p-4 flex items-center gap-4 relative group">
                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-lg text-slate-600 dark:text-slate-300 shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 truncate">
                                {member.name}
                                {member.role === 'owner' && <Key className="w-3.5 h-3.5 text-amber-500" title="Owner" />}
                                {member.role === 'admin' && <Shield className="w-3.5 h-3.5 text-blue-500" title="Admin" />}
                            </h4>
                            <p className="text-xs text-slate-500 truncate">
                                {member.isOffline ? 'Offline Member' : 'Registered User'} 
                                {member.village ? ` • ${member.village}` : ''}
                            </p>
                            {member.phone && <p className="text-xs text-slate-500 truncate">{member.phone}</p>}
                        </div>

                        {isAdmin && member.role !== 'owner' && group.status !== 'closed' && (
                            <div className="relative">
                                {/* Actions dropdown could go here, for now using direct buttons for simplicity on hover */}
                                <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm">
                                    {isOwner && member.role === 'member' && (
                                        <button onClick={() => handleUpdateRole(member._id, 'admin')} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="Promote to Admin"><Shield className="w-4 h-4" /></button>
                                    )}
                                    {isOwner && member.role === 'admin' && (
                                        <button onClick={() => handleUpdateRole(member._id, 'member')} className="p-1.5 text-slate-500 hover:bg-slate-50 rounded" title="Demote to Member"><ShieldAlert className="w-4 h-4" /></button>
                                    )}
                                    {isOwner && !member.isOffline && (
                                        <button onClick={() => handleTransfer(member._id, member.user)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded" title="Transfer Ownership"><Key className="w-4 h-4" /></button>
                                    )}
                                    <button onClick={() => handleRemove(member._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Remove Member"><UserX className="w-4 h-4" /></button>
                                </div>
                                <button className="sm:hidden p-2 text-slate-400"><MoreVertical className="w-5 h-5"/></button>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Members;
