import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import {
    ArrowLeft, Sprout, Plus, Trash2,
    Droplets, User, Tractor, ShoppingBag, Receipt, Calendar,
    CheckCircle, TrendingUp, Store, X
} from "lucide-react";
import Swal from "sweetalert2";

const CropDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [crop, setCrop] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- STATES ---
    // Expense Form State
    const [expenseData, setExpenseData] = useState({ type: "Fertilizer", amount: "", date: new Date().toISOString().split("T")[0] });
    const [customType, setCustomType] = useState("");
    const [showExpenseForm, setShowExpenseForm] = useState(false);

    // Market Listing State (Moved Inside)
    const [showListForm, setShowListForm] = useState(false);
    const [marketData, setMarketData] = useState({ price: "", quantity: "", desc: "" });

    // --- FETCH DATA ---
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

    // --- HANDLERS ---

    // 1. Add Expense
    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!expenseData.amount) return;
        const finalType = expenseData.type === "Other" ? customType : expenseData.type;
        if (!finalType.trim()) return Swal.fire("Info", "Please specify name", "warning");

        try {
            const token = localStorage.getItem("token");
            const payload = { ...expenseData, type: finalType };
            await api.put(`/crops/expense/${id}`, payload, { headers: { "auth-token": token } });
            Swal.fire({ title: "Added!", icon: "success", timer: 1000, showConfirmButton: false });
            setShowExpenseForm(false);
            setExpenseData({ type: "Fertilizer", amount: "", date: new Date().toISOString().split("T")[0] });
            setCustomType("");
            fetchCrop();
        } catch (err) { Swal.fire("Error", "Failed to add", "error"); }
    };

    // 2. Delete Expense
    const handleDeleteExpense = async (expenseId) => {
        const result = await Swal.fire({
            title: 'Remove expense?',
            text: "This will adjust your total cost.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                await api.delete(`/crops/expense/${id}/${expenseId}`, { headers: { "auth-token": token } });
                fetchCrop();
                Swal.fire('Deleted!', 'Updated successfully.', 'success');
            } catch (err) { Swal.fire('Error', 'Failed to delete', 'error'); }
        }
    };

    // 3. Sell Crop (Close Cycle)
    const handleSellCrop = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Harvest & Sell',
            html:
                '<label>Total Yield (Quintals)</label>' +
                '<input id="swal-yield" type="number" class="swal2-input" placeholder="e.g. 40">' +
                '<label>Total Revenue (Sold Price)</label>' +
                '<input id="swal-revenue" type="number" class="swal2-input" placeholder="e.g. 250000">',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Mark as Sold',
            confirmButtonColor: '#16a34a',
            preConfirm: () => {
                return [
                    document.getElementById('swal-yield').value,
                    document.getElementById('swal-revenue').value
                ]
            }
        });

        if (formValues) {
            const [yieldQty, revenue] = formValues;
            if (!yieldQty || !revenue) return Swal.fire("Error", "Please fill all fields", "error");

            try {
                const token = localStorage.getItem("token");
                await api.put(`/crops/sell/${id}`, { yieldQty, revenue }, { headers: { "auth-token": token } });
                fetchCrop();
                Swal.fire("Congratulations!", "Crop Cycle Completed!", "success");
            } catch (err) {
                Swal.fire("Error", "Could not update status", "error");
            }
        }
    };

    // 4. List on Market (New)
    const handleListOnMarket = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await api.put(`/crops/market/toggle/${id}`, {
                isListed: true,
                expectedPrice: marketData.price,
                quantityAvailable: marketData.quantity,
                description: marketData.desc
            }, { headers: { "auth-token": token } });

            Swal.fire("Listed!", "Your crop is now visible to buyers.", "success");
            setShowListForm(false);
            fetchCrop();
        } catch (err) {
            Swal.fire("Error", "Could not list crop", "error");
        }
    };

    // 5. Remove from Market (New)
    const handleRemoveFromMarket = async () => {
        const result = await Swal.fire({
            title: 'Remove from Market?',
            text: "Buyers will no longer see this crop.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, remove it',
            confirmButtonColor: '#d33'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                await api.put(`/crops/market/toggle/${id}`, { isListed: false }, { headers: { "auth-token": token } });
                fetchCrop();
                Swal.fire("Removed", "Listing deactivated.", "success");
            } catch (err) {
                Swal.fire("Error", "Could not remove listing", "error");
            }
        }
    };

    // Helper Icons
    const getExpenseIcon = (type) => {
        const lowerType = type.toLowerCase();
        if (lowerType.includes("fertilizer")) return <Droplets className="w-5 h-5 text-blue-600" />;
        if (lowerType.includes("labor")) return <User className="w-5 h-5 text-orange-600" />;
        if (lowerType.includes("machinery") || lowerType.includes("tractor")) return <Tractor className="w-5 h-5 text-red-600" />;
        if (lowerType.includes("seed")) return <Sprout className="w-5 h-5 text-green-700" />;
        return <Receipt className="w-5 h-5 text-gray-600" />;
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div></div>;
    if (!crop) return null;

    const totalCost = crop.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const sortedExpenses = [...crop.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Profit Calculation
    const isSold = crop.status === 'sold';
    const profit = crop.revenue - totalCost;
    const isProfit = profit >= 0;

    return (
        <div className="min-h-screen bg-gray-100 pb-10">

            {/* Header */}
            <div className={`px-6 pt-8 pb-16 text-white relative shadow-lg transition-colors duration-500 ${isSold ? (isProfit ? 'bg-gradient-to-r from-emerald-700 to-emerald-600' : 'bg-gradient-to-r from-red-700 to-red-600') : 'bg-gradient-to-r from-green-800 to-green-700'}`}>
                <div className="max-w-2xl mx-auto relative">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute -left-2 top-1 p-2 bg-white/20 rounded-full hover:bg-white/30 transition backdrop-blur-md"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="text-center">
                        <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm shadow-inner border border-white/20">
                            {isSold ? <CheckCircle className="w-8 h-8 text-white" /> : <Sprout className="w-8 h-8 text-white" />}
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">{crop.cropName}</h1>
                        <div className="flex justify-center gap-3 mt-2 text-white/90 text-sm font-medium">
                            <span className="uppercase bg-white/20 px-2 py-0.5 rounded text-xs tracking-wider">{crop.status}</span>
                            <span>•</span>
                            <span>{crop.area} Acres</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 -mt-10 relative z-10 space-y-6">

                {/* --- PROFIT / LOSS CARD (Only if Sold) --- */}
                {isSold ? (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                        <div className="p-6 text-center">
                            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-1">Net {isProfit ? "Profit" : "Loss"}</p>
                            <h2 className={`text-5xl font-extrabold ${isProfit ? "text-emerald-600" : "text-red-600"}`}>
                                {isProfit ? "+" : "-"}₹{Math.abs(profit).toLocaleString('en-IN')}
                            </h2>
                        </div>
                        <div className="bg-gray-50 border-t border-gray-200 flex divide-x divide-gray-200">
                            <div className="flex-1 p-4 text-center">
                                <p className="text-xs text-gray-400 font-bold uppercase">Revenue</p>
                                <p className="text-lg font-bold text-gray-800">₹{crop.revenue.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="flex-1 p-4 text-center">
                                <p className="text-xs text-gray-400 font-bold uppercase">Expenses</p>
                                <p className="text-lg font-bold text-red-500">- ₹{totalCost.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="flex-1 p-4 text-center">
                                <p className="text-xs text-gray-400 font-bold uppercase">Yield</p>
                                <p className="text-lg font-bold text-blue-600">{crop.yieldQty} Qtl</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* --- ACTIVE STATE: Total Cost & Action --- */
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-300 flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Current Investment</p>
                            <h2 className="text-4xl font-bold text-gray-800 flex items-center gap-1">
                                <span className="text-2xl text-gray-500">₹</span> {totalCost.toLocaleString()}
                            </h2>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => setShowExpenseForm(!showExpenseForm)}
                                className="px-4 py-2 bg-gray-900 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm transition active:scale-95 text-sm"
                            >
                                <Plus className="w-4 h-4" /> Add Expense
                            </button>
                            <button
                                onClick={handleSellCrop}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm transition active:scale-95 text-sm"
                            >
                                <TrendingUp className="w-4 h-4" /> Harvest & Sell
                            </button>
                        </div>
                    </div>
                )}

                {/* --- MARKET LISTING SECTION (Farmer Side) --- */}
                {!isSold && (
                    <>
                        {!crop.isListed ? (
                            <button
                                onClick={() => setShowListForm(true)}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition"
                            >
                                <Store className="w-5 h-5" /> Sell on Marketplace
                            </button>
                        ) : (
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Store className="w-4 h-4 text-orange-700" />
                                        <h3 className="text-orange-800 font-bold">Listed on Market</h3>
                                        <span className="bg-orange-200 text-orange-800 text-[10px] px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                                    </div>
                                    <p className="text-sm text-gray-600">Price: ₹{crop.expectedPrice}/Qtl • Qty: {crop.quantityAvailable} Qtl</p>
                                </div>
                                <button
                                    onClick={handleRemoveFromMarket}
                                    className="bg-white border border-orange-200 text-orange-600 p-2 rounded-lg hover:bg-orange-100 transition"
                                    title="Remove from Market"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* --- ADD EXPENSE FORM (Hidden if Sold) --- */}
                {showExpenseForm && !isSold && (
                    <div className="bg-white rounded-2xl shadow-md border border-green-600 p-6 animate-in fade-in slide-in-from-top-4 ring-1 ring-green-100">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-green-700" /> New Expense
                        </h3>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Type</label>
                                    <select
                                        className="w-full border border-gray-400 p-2.5 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-green-600 outline-none"
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
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Date</label>
                                    <input
                                        type="date"
                                        className="w-full border border-gray-400 p-2.5 rounded-lg text-gray-800 focus:ring-2 focus:ring-green-600 outline-none"
                                        value={expenseData.date}
                                        onChange={(e) => setExpenseData({ ...expenseData, date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {expenseData.type === "Other" && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Specify Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Transport"
                                        className="w-full border border-gray-400 p-2.5 rounded-lg focus:ring-2 focus:ring-green-600 outline-none"
                                        value={customType}
                                        onChange={(e) => setCustomType(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Amount</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 5000"
                                    className="w-full border border-gray-400 p-2.5 rounded-lg text-gray-800 focus:ring-2 focus:ring-green-600 outline-none font-bold"
                                    value={expenseData.amount}
                                    onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                                    required
                                />
                            </div>

                            <button type="submit" className="w-full bg-black text-white py-3 rounded-xl font-bold mt-2">
                                Save Expense
                            </button>
                        </form>
                    </div>
                )}

                {/* --- EXPENSE HISTORY --- */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-300 overflow-hidden">
                    <div className="bg-gray-100 px-6 py-4 border-b border-gray-300 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">Expense History</h3>
                        <span className="text-xs font-bold text-gray-600 bg-white border border-gray-300 px-2 py-1 rounded-full">{crop.expenses.length} Records</span>
                    </div>

                    {sortedExpenses.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">
                            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No expenses yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {sortedExpenses.map((exp, index) => (
                                <div key={index} className="p-5 flex justify-between items-center hover:bg-gray-50 transition">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                                            {getExpenseIcon(exp.type)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{exp.type}</p>
                                            <p className="text-xs text-gray-500">{new Date(exp.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-red-700 bg-red-50 border border-red-100 px-3 py-1 rounded-lg text-sm">
                                            - ₹{exp.amount.toLocaleString('en-IN')}
                                        </span>
                                        {!isSold && (
                                            <button onClick={() => handleDeleteExpense(exp._id)} className="text-gray-400 hover:text-red-600 transition">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* --- LISTING FORM MODAL --- */}
            {showListForm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-in zoom-in duration-200 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Sell {crop.cropName}</h3>
                            <button onClick={() => setShowListForm(false)} className="bg-gray-100 p-1 rounded-full hover:bg-gray-200"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleListOnMarket} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity (Quintals)</label>
                                <input type="number" required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                    placeholder="e.g. 50"
                                    onChange={e => setMarketData({ ...marketData, quantity: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expected Price (₹/Qtl)</label>
                                <input type="number" required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                    placeholder="e.g. 2500"
                                    onChange={e => setMarketData({ ...marketData, price: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                                <textarea className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="e.g. Fresh organic harvest..." rows="3"
                                    onChange={e => setMarketData({ ...marketData, desc: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3.5 rounded-xl font-bold shadow-md transition">Confirm Listing</button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CropDetails;