import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import {
    ArrowLeft, Sprout, Plus, Trash2,
    Droplets, User, Tractor, ShoppingBag, Receipt, Calendar,
    CheckCircle, TrendingUp, Store, X
} from "lucide-react";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import Button from "../../components/ui/Button";
import LoadingState from "../../components/ui/LoadingState";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseHistory from "./components/ExpenseHistory";

const CropDetails = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [crop, setCrop] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- STATES ---
    const [expenseData, setExpenseData] = useState({ type: "Fertilizer", amount: "", date: new Date().toISOString().split("T")[0] });
    const [customType, setCustomType] = useState("");
    const [showExpenseForm, setShowExpenseForm] = useState(false);

    // Market Listing State
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
    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!expenseData.amount) return;
        const finalType = expenseData.type === "Other" ? customType : expenseData.type;
        if (!finalType.trim()) return Swal.fire("Info", "Please specify name", "warning");

        try {
            const token = localStorage.getItem("token");
            const payload = { ...expenseData, type: finalType };
            await api.put(`/crops/expense/${id}`, payload, { headers: { "auth-token": token } });
            Swal.fire({ title: t('common.save'), icon: "success", timer: 1000, showConfirmButton: false });
            setShowExpenseForm(false);
            setExpenseData({ type: "Fertilizer", amount: "", date: new Date().toISOString().split("T")[0] });
            setCustomType("");
            fetchCrop();
        } catch (err) { Swal.fire("Error", "Failed to add", "error"); }
    };

    const handleDeleteExpense = async (expenseId) => {
        const result = await Swal.fire({
            title: t('common.delete') + '?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: t('common.yes'),
            cancelButtonText: t('common.no')
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

    const handleSellCrop = async () => {
        const { value: formValues } = await Swal.fire({
            title: t('crop.harvest_sell'),
            html:
                `<label>${t('crop.yield')} (Qtl)</label>` +
                '<input id="swal-yield" type="number" class="swal2-input" placeholder="e.g. 40">' +
                `<label>${t('crop.revenue')} (₹)</label>` +
                '<input id="swal-revenue" type="number" class="swal2-input" placeholder="e.g. 250000">',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: t('common.save'),
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
                Swal.fire("Success", "Crop Cycle Completed!", "success");
            } catch (err) {
                Swal.fire("Error", "Could not update status", "error");
            }
        }
    };

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

    const handleRemoveFromMarket = async () => {
        const result = await Swal.fire({
            title: t('crop.remove_market') + '?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('common.yes'),
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

    if (loading) return <LoadingState fullScreen={true} message="Loading crop details..." />;
    if (!crop) return null;

    // --- RESTORED VARIABLES ---
    const totalCost = crop.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    // This variable was missing, causing the crash:
    const sortedExpenses = [...crop.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    const isSold = crop.status === 'sold';
    const profit = crop.revenue - totalCost;
    const isProfit = profit >= 0;

    // Translation logic for crop name (Matches JSON 'crops_list')
    const displayCropName = t(`crops_list.${crop.cropName.toLowerCase()}`, { defaultValue: crop.cropName });

    return (
        <div className="min-h-screen bg-agriBg pb-10">

            {/* Header */}
            <div className={`px-6 pt-8 pb-16 text-white relative shadow-lg transition-colors duration-500 ${isSold ? (isProfit ? 'bg-gradient-to-r from-emerald-700 to-emerald-600' : 'bg-gradient-to-r from-red-700 to-red-600') : 'bg-gradient-to-r from-green-800 to-green-700'}`}>
                <div className="max-w-2xl mx-auto relative">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute -left-2 top-1 p-2 bg-white/20 rounded-full hover:bg-white/30 transition backdrop-blur-md min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="text-center">
                        <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm shadow-inner border border-white/20">
                            {isSold ? <CheckCircle className="w-8 h-8 text-white" /> : <Sprout className="w-8 h-8 text-white" />}
                        </div>
                        {/* Display Translated Crop Name */}
                        <h1 className="text-3xl font-bold tracking-tight">{displayCropName}</h1>
                        <div className="flex justify-center gap-3 mt-2 text-white/90 text-sm font-medium">
                            <span className="uppercase bg-white/20 px-2 py-0.5 rounded text-xs tracking-wider">
                                {t(`crop.${crop.status}`, { defaultValue: crop.status })}
                            </span>
                            <span>•</span>
                            <span>{crop.area} {t('dashboard.area')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 -mt-10 relative z-10 space-y-6">

                {/* --- PROFIT / LOSS CARD (Only if Sold) --- */}
                {isSold ? (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                        <div className="p-6 text-center">
                            {/* Translated Net Profit/Loss */}
                            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-1">{isProfit ? t('crop.net_profit') : t('crop.net_loss')}</p>
                            <h2 className={`text-5xl font-extrabold ${isProfit ? "text-emerald-600" : "text-red-600"}`}>
                                {isProfit ? "+" : "-"}₹{Math.abs(profit).toLocaleString('en-IN')}
                            </h2>
                        </div>
                        <div className="bg-agriBg border-t border-gray-200 flex divide-x divide-gray-200">
                            <div className="flex-1 p-4 text-center">
                                <p className="text-xs text-gray-400 font-bold uppercase">{t('crop.revenue')}</p>
                                <p className="text-lg font-bold text-gray-800">₹{crop.revenue.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="flex-1 p-4 text-center">
                                <p className="text-xs text-gray-400 font-bold uppercase">{t('crop.expenses')}</p>
                                <p className="text-lg font-bold text-red-500">- ₹{totalCost.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="flex-1 p-4 text-center">
                                <p className="text-xs text-gray-400 font-bold uppercase">{t('crop.yield')}</p>
                                <p className="text-lg font-bold text-blue-600">{crop.yieldQty} Qtl</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* --- ACTIVE STATE: Total Cost & Action --- */
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-300 flex justify-between items-center">
                        <div>
                            {/* Translated Investment */}
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{t('crop.invest')}</p>
                            <h2 className="text-4xl font-bold text-gray-800 flex items-center gap-1">
                                <span className="text-2xl text-gray-500">₹</span> {totalCost.toLocaleString()}
                            </h2>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => setShowExpenseForm(!showExpenseForm)}
                                variant="secondary"
                                icon={Plus}
                            >
                                {t('crop.add_expense')}
                            </Button>
                            <Button
                                onClick={handleSellCrop}
                                variant="primary"
                                icon={TrendingUp}
                            >
                                {t('crop.harvest_sell')}
                            </Button>
                        </div>
                    </div>
                )}

                {/* --- MARKET LISTING SECTION (Farmer Side) --- */}
                {!isSold && (
                    <>
                        {!crop.isListed ? (
                            <Button
                                onClick={() => setShowListForm(true)}
                                variant="primary"
                                fullWidth
                                icon={Store}
                                className="bg-orange-600 hover:bg-orange-700 mt-2"
                            >
                                {t('crop.sell_mkt')}
                            </Button>
                        ) : (
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Store className="w-4 h-4 text-orange-700" />
                                        {/* Translated Listed */}
                                        <h3 className="text-orange-800 font-bold">{t('crop.listed')}</h3>
                                        <span className="bg-orange-200 text-orange-800 text-[10px] px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                                    </div>
                                    <p className="text-sm text-gray-600">Price: ₹{crop.expectedPrice}/Qtl • Qty: {crop.quantityAvailable} Qtl</p>
                                </div>
                                <button
                                    onClick={handleRemoveFromMarket}
                                    className="bg-white border border-orange-200 text-orange-600 p-2 rounded-lg hover:bg-orange-100 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    title={t('crop.remove')}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* --- ADD EXPENSE FORM (Hidden if Sold) --- */}
                {showExpenseForm && !isSold && (
                    <ExpenseForm 
                        expenseData={expenseData}
                        setExpenseData={setExpenseData}
                        customType={customType}
                        setCustomType={setCustomType}
                        handleAddExpense={handleAddExpense}
                        t={t}
                    />
                )}

                {/* --- EXPENSE HISTORY --- */}
                <ExpenseHistory 
                    expenses={crop.expenses}
                    sortedExpenses={sortedExpenses}
                    getExpenseIcon={getExpenseIcon}
                    handleDeleteExpense={handleDeleteExpense}
                    isSold={isSold}
                    setShowExpenseForm={setShowExpenseForm}
                    t={t}
                />

            </div>

            {/* --- LISTING FORM MODAL --- */}
            {showListForm && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-in zoom-in duration-200 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Sell {displayCropName}</h3>
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
                            <Button type="submit" variant="primary" className="bg-orange-600 hover:bg-orange-700 w-full mt-4">
                                Confirm Listing
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CropDetails;
