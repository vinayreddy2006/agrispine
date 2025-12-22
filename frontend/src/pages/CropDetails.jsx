import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import {
    ArrowLeft, Sprout, Plus, IndianRupee, Trash2,
    Droplets, User, Tractor, ShoppingBag, Receipt, Calendar
} from "lucide-react";
import Swal from "sweetalert2";

const CropDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [crop, setCrop] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form State
    const [expenseData, setExpenseData] = useState({
        type: "Fertilizer",
        amount: "",
        date: new Date().toISOString().split("T")[0]
    });
    const [showForm, setShowForm] = useState(false);

    // Fetch Crop Data
    const fetchCrop = async () => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await api.get(`/crops/${id}`, { headers: { "auth-token": token } });
            setCrop(data);
        } catch (err) {
            console.error(err);
            navigate("/dashboard");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCrop(); }, [id]);

    // Add Expense Logic
    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!expenseData.amount) return;

        try {
            const token = localStorage.getItem("token");
            await api.put(`/crops/expense/${id}`, expenseData, { headers: { "auth-token": token } });

            Swal.fire({
                title: "Added!",
                text: "Expense tracked successfully.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            });

            setShowForm(false);
            setExpenseData({ type: "Fertilizer", amount: "", date: new Date().toISOString().split("T")[0] });
            fetchCrop(); // Refresh data
        } catch (err) {
            Swal.fire("Error", "Could not add expense", "error");
        }
    };

    // Helper to get Icon based on Expense Type
    const getExpenseIcon = (type) => {
        switch (type) {
            case "Fertilizer": return <Droplets className="w-5 h-5 text-blue-500" />;
            case "Labor": return <User className="w-5 h-5 text-orange-500" />;
            case "Machinery Rent": return <Tractor className="w-5 h-5 text-red-500" />;
            case "Seeds": return <Sprout className="w-5 h-5 text-green-600" />;
            case "Pesticides": return <ShoppingBag className="w-5 h-5 text-purple-500" />;
            default: return <Receipt className="w-5 h-5 text-gray-500" />;
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
    );

    if (!crop) return null;

    const totalCost = crop.expenses.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="min-h-screen bg-gray-50 pb-10">

            {/* --- HEADER --- */}
            <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 pt-8 pb-16 text-white relative shadow-md">
                <div className="max-w-2xl mx-auto relative">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="absolute -left-2 top-1 p-2 bg-white/10 rounded-full hover:bg-white/20 transition backdrop-blur-md"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>

                    <div className="text-center">
                        <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm shadow-inner border border-white/10">
                            <Sprout className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">{crop.cropName}</h1>
                        <div className="flex justify-center gap-3 mt-2 text-green-100 text-sm font-medium">
                            <span>📏 {crop.area} Acres</span>
                            <span>•</span>
                            <span>📅 Sown: {new Date(crop.sowingDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 -mt-10 relative z-10">

                {/* --- TOTAL COST CARD --- */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 flex justify-between items-center mb-6">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Investment</p>
                        <h2 className="text-4xl font-bold text-gray-800 flex items-center gap-1">
                            <span className="text-2xl text-gray-400">₹</span> {totalCost.toLocaleString()}
                        </h2>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={`px-5 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition active:scale-95
               ${showForm ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-green-600 text-white hover:bg-green-700"}`}
                    >
                        {showForm ? "Cancel" : <><Plus className="w-5 h-5" /> Add Cost</>}
                    </button>
                </div>

                {/* --- ADD EXPENSE FORM --- */}
                {showForm && (
                    <div className="bg-white rounded-2xl shadow-md border border-green-100 p-6 mb-6 animate-in fade-in slide-in-from-top-4">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-green-600" /> New Expense
                        </h3>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Type</label>
                                    <select
                                        className="w-full border border-gray-300 p-2.5 rounded-lg bg-white focus:ring-2 focus:ring-green-500 outline-none"
                                        value={expenseData.type}
                                        onChange={(e) => setExpenseData({ ...expenseData, type: e.target.value })}
                                    >
                                        <option>Fertilizer</option>
                                        <option>Seeds</option>
                                        <option>Pesticides</option>
                                        <option>Labor</option>
                                        <option>Machinery Rent</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Date</label>
                                    <input
                                        type="date"
                                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        value={expenseData.date}
                                        onChange={(e) => setExpenseData({ ...expenseData, date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-500 font-bold">₹</span>
                                    <input
                                        type="number"
                                        placeholder="e.g. 5000"
                                        className="w-full border border-gray-300 pl-8 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-bold text-gray-800"
                                        value={expenseData.amount}
                                        onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-xl font-bold transition shadow-lg mt-2">
                                Save Expense
                            </button>
                        </form>
                    </div>
                )}

                {/* --- EXPENSES LIST --- */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">Expense History</h3>
                        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{crop.expenses.length} Records</span>
                    </div>

                    {crop.expenses.length === 0 ? (
                        <div className="p-10 text-center flex flex-col items-center justify-center">
                            <div className="bg-green-50 p-4 rounded-full mb-3">
                                <Receipt className="w-8 h-8 text-green-300" />
                            </div>
                            <p className="text-gray-500 font-medium">No expenses recorded yet.</p>
                            <p className="text-gray-400 text-sm mt-1">Add your costs to track profit.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {crop.expenses.slice().reverse().map((exp, index) => (
                                <div key={index} className="p-5 flex justify-between items-center hover:bg-gray-50 transition group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition">
                                            {getExpenseIcon(exp.type)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{exp.type}</p>
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {new Date(exp.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="font-bold text-red-600 bg-red-50 px-3 py-1 rounded-lg text-sm">
                                        - ₹{exp.amount.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default CropDetails;