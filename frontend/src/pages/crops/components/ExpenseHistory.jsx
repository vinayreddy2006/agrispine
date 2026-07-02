import React from 'react';
import { Trash2, Receipt } from 'lucide-react';
import EmptyState from '../../../components/ui/EmptyState';

const ExpenseHistory = ({
    expenses,
    sortedExpenses,
    getExpenseIcon,
    handleDeleteExpense,
    isSold,
    setShowExpenseForm,
    t
}) => {
    return (
        <div className="bg-surface dark:bg-gray-800 rounded-2xl shadow-md border border-border dark:border-gray-700 overflow-hidden">
            <div className="bg-background dark:bg-gray-900 px-6 py-4 border-b border-border dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-text-primary dark:text-white">{t('crop.expense_history')}</h3>
                <span className="text-xs font-bold text-text-muted dark:text-gray-400 bg-surface dark:bg-gray-800 border border-border dark:border-gray-600 px-2 py-1 rounded-full">{expenses.length} Records</span>
            </div>

            {expenses.length === 0 ? (
                <div className="p-6">
                    <EmptyState 
                        title={t('crop.no_exp_yet')} 
                        description="Track your expenses to see detailed profit and loss calculations."
                        icon={Receipt}
                        actionText="Add Expense"
                        onAction={() => setShowExpenseForm(true)}
                    />
                </div>
            ) : (
                <div className="divide-y divide-border dark:divide-gray-700">
                    {sortedExpenses.map((exp, index) => (
                        <div key={index} className="p-5 flex justify-between items-center hover:bg-background dark:hover:bg-gray-700/50 transition">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-surface dark:bg-gray-700 border border-border dark:border-gray-600 flex items-center justify-center shadow-sm">
                                    {getExpenseIcon(exp.type)}
                                </div>
                                <div>
                                    <p className="font-bold text-text-primary dark:text-gray-200 text-sm">{exp.type}</p>
                                    <p className="text-xs text-text-muted dark:text-gray-400">{new Date(exp.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 px-3 py-1 rounded-lg text-sm">
                                    - ₹{exp.amount.toLocaleString('en-IN')}
                                </span>
                                {!isSold && (
                                    <button onClick={() => handleDeleteExpense(exp._id)} className="text-text-muted dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition min-h-[44px] min-w-[44px] flex items-center justify-center">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ExpenseHistory;
