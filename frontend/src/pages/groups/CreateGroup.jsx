import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import { createGroup } from '../../api/groupService';

const CreateGroup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', village: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await createGroup(formData);
            if (res.data.success) {
                navigate(`/groups/${res.data.group._id}`);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pb-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <PageHeader title="Create Work Group" subtitle="Form a new farming team" />
            
            <Card className="p-8 mt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200">
                            {error}
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Group Name
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                            placeholder="e.g. Village Harvesters"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Village (Optional)
                        </label>
                        <input
                            type="text"
                            value={formData.village}
                            onChange={(e) => setFormData({...formData, village: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500 outline-none transition-all"
                            placeholder="e.g. Rampur"
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Group'}
                    </button>
                </form>
            </Card>
        </div>
    );
};

export default CreateGroup;
