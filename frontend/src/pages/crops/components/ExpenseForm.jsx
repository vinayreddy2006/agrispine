import React from 'react';
import { Receipt } from 'lucide-react';
import Button from '../../../components/ui/Button';

const ExpenseForm = ({
    expenseData,
    setExpenseData,
    customType,
    setCustomType,
    handleAddExpense,
    t
}) => {
    return (
        <div className="bg-surface dark:bg-gray-800 rounded-2xl shadow-md border border-green-600 dark:border-green-500 p-6 animate-in fade-in slide-in-from-top-4 ring-1 ring-green-100 dark:ring-green-900/30">
            <h3 className="font-bold text-text-primary dark:text-white mb-4 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-green-700 dark:text-green-500" /> {t('crop.new_exp')}
            </h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-text-muted dark:text-gray-400 mb-1 uppercase">Type</label>
                        <select
                            className="w-full border border-border dark:border-gray-600 p-2.5 rounded-lg bg-surface dark:bg-gray-700 text-text-primary dark:text-white focus:ring-2 focus:ring-green-600 outline-none"
                            value={expenseData.type}
                            onChange={(e) => {
                                setExpenseData({ ...expenseData, type: e.target.value });
                                if (e.target.value !== "Other") setCustomType("");
                            }}
                        >
                            <option>Fertilizer</option>
                            <option>Seeds</option>
                            <option>Pesticides</option>
                            <option>Labor</option>
                            <option>Machinery Rent</option>
                            <option value="Other">Other (Specify)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-text-muted dark:text-gray-400 mb-1 uppercase">Date</label>
                        <input
                            type="date"
                            className="w-full border border-border dark:border-gray-600 p-2.5 rounded-lg bg-surface dark:bg-gray-700 text-text-primary dark:text-white focus:ring-2 focus:ring-green-600 outline-none"
                            value={expenseData.date}
                            onChange={(e) => setExpenseData({ ...expenseData, date: e.target.value })}
                            required
                        />
                    </div>
                </div>

                {expenseData.type === "Other" && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-bold text-text-muted dark:text-gray-400 mb-1 uppercase">Specify Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Transport"
                            className="w-full border border-border dark:border-gray-600 p-2.5 rounded-lg bg-surface dark:bg-gray-700 text-text-primary dark:text-white focus:ring-2 focus:ring-green-600 outline-none"
                            value={customType}
                            onChange={(e) => setCustomType(e.target.value)}
                            required
                        />
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-text-muted dark:text-gray-400 mb-1 uppercase">Amount</label>
                    <input
                        type="number"
                        placeholder="e.g. 5000"
                        className="w-full border border-border dark:border-gray-600 p-2.5 rounded-lg bg-surface dark:bg-gray-700 text-text-primary dark:text-white focus:ring-2 focus:ring-green-600 outline-none font-bold"
                        value={expenseData.amount}
                        onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                        required
                    />
                </div>

                <Button type="submit" variant="primary" className="bg-gray-900 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 w-full mt-4">
                    {t('crop.save_expense')}
                </Button>
            </form>
        </div>
    );
};

export default ExpenseForm;
