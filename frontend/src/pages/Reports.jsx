import { useEffect, useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, PieChart as PieIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

const Reports = () => {
    const navigate = useNavigate();
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                const { data } = await api.get("/crops/fetchall", { headers: { "auth-token": token } });
                setCrops(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
    );

    // --- CALCULATE TOTALS ---
    let totalInvestment = 0;
    let totalRevenue = 0;

    const cropPerformance = crops.map(crop => {
        const expenses = crop.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const revenue = crop.revenue || 0;
        const profit = revenue - expenses;

        totalInvestment += expenses;
        totalRevenue += revenue;

        return {
            name: crop.cropName,
            profit: profit,
            isProfit: profit >= 0
        };
    });

    const netProfit = totalRevenue - totalInvestment;

    const expenseCategoryMap = {};
    crops.forEach(crop => {
        crop.expenses.forEach(exp => {
            if (expenseCategoryMap[exp.type]) {
                expenseCategoryMap[exp.type] += exp.amount;
            } else {
                expenseCategoryMap[exp.type] = exp.amount;
            }
        });
    });

    const expenseData = Object.keys(expenseCategoryMap).map(key => ({
        name: key,
        value: expenseCategoryMap[key]
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

    return (
        <div className="w-full">

            {/* Header */}
            <div className="bg-white px-6 py-6 shadow-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto flex items-center gap-3">
                    <button onClick={() => navigate("/dashboard")} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">Farm Analytics</h1>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 mt-8 space-y-8">

                {/* 1. OVERVIEW CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Investment</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">₹{totalInvestment.toLocaleString('en-IN')}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-green-600 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</h3>
                    </div>
                    <div className={`p-6 rounded-2xl shadow-sm border ${netProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <p className={`text-xs font-bold uppercase tracking-wider ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>Net Profit</p>
                        <h3 className={`text-3xl font-extrabold mt-1 ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {netProfit >= 0 ? "+" : "-"}₹{Math.abs(netProfit).toLocaleString('en-IN')}
                        </h3>
                    </div>
                </div>

                {/* 2. CHARTS SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Bar Chart: Profit per Crop */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-96">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-5 h-5 text-gray-500" />
                            <h3 className="font-bold text-gray-700">Profit by Crop</h3>
                        </div>

                        {/* 👇 FIX: Wrapper with relative/absolute positioning */}
                        <div className="flex-1 w-full relative min-h-0">
                            <div className="absolute inset-0">
                                {cropPerformance.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={cropPerformance} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis hide />
                                            <Tooltip
                                                formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                            <Bar dataKey="profit" radius={[4, 4, 4, 4]}>
                                                {cropPerformance.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.isProfit ? '#16a34a' : '#dc2626'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                        No crop data available.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pie Chart: Expense Breakdown */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-96">
                        <div className="flex items-center gap-2 mb-4">
                            <PieIcon className="w-5 h-5 text-gray-500" />
                            <h3 className="font-bold text-gray-700">Where did money go?</h3>
                        </div>

                        {/* 👇 FIX: Wrapper with relative/absolute positioning */}
                        <div className="flex-1 w-full relative min-h-0">
                            <div className="absolute inset-0">
                                {expenseData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={expenseData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {expenseData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                        No expenses recorded yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default Reports;