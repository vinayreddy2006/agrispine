import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { IndianRupee } from 'lucide-react';
import Card from '../../../components/ui/Card';
import axiosClient from '../../../api/axiosClient';

const MySettlements = ({ group, currentUserMember }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettlements = async () => {
            try {
                // Fetch settlements directly using axios to avoid circular dependency
                const response = await axiosClient.get(`/groups/${group._id}/settlements`);
                const allSettlements = response.data.settlements;
                
                // Filter to only settlements that included this member
                const mySettlements = allSettlements.filter(s => 
                    s.distributions?.some(d => d.memberId === currentUserMember?._id)
                );
                
                setHistory(mySettlements);
            } catch (error) {
                console.error("Failed to fetch settlements", error);
            } finally {
                setLoading(false);
            }
        };

        if (group && currentUserMember) {
            fetchSettlements();
        }
    }, [group, currentUserMember]);

    if (loading) {
        return <div className="text-center py-12">Loading your settlements...</div>;
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">My Settlement History</h3>
            
            {history.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    You have no settlement history in this group yet.
                </div>
            ) : (
                <div className="grid gap-4">
                    {history.map((settlement, index) => {
                        // Find my specific distribution
                        const myDist = settlement.distributions.find(d => d.memberId === currentUserMember?._id);
                        
                        return (
                            <Card key={index} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-l-4 border-l-green-500">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-slate-800 dark:text-white text-lg">
                                            {format(new Date(settlement.createdAt), 'dd MMM yyyy')}
                                        </h4>
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">SETTLED</span>
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        Covered {myDist?.recordsIncluded?.length || 0} work days
                                    </p>
                                    {settlement.notes && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 italic border-l-2 border-slate-200 dark:border-slate-700 pl-2">
                                            "{settlement.notes}"
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-500 mb-1">Amount Received</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center justify-end">
                                        <IndianRupee className="w-5 h-5" /> {myDist ? Math.round(myDist.amount) : 0}
                                    </p>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MySettlements;
