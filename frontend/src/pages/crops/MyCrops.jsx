import { useEffect, useState } from "react";
import api from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { Plus, Sprout, Calendar, ChevronRight, CheckCircle, Leaf } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

const MyCrops = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCrops = async () => {
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
        fetchCrops();
    }, []);

    return (
        <div className="w-full pb-24 animate-in fade-in duration-500">
            <PageHeader 
                title={t('dashboard.my_crops')}
                icon={Sprout}
                rightActions={
                    <button
                        onClick={() => navigate("/add-crop")}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-sm shadow-green-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> {t('dashboard.add_crop')}
                    </button>
                }
            />

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-48 bg-white dark:bg-slate-800 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-700 shadow-sm"></div>
                        ))}
                    </div>
                ) : crops.length === 0 ? (
                    <div className="mt-12">
                        <EmptyState 
                            title={t('dashboard.no_crops')}
                            description="Start tracking your farm today."
                            icon={Leaf}
                            actionText={t('dashboard.add_first_crop')}
                            onAction={() => navigate("/add-crop")}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {crops.map((crop) => {
                            const totalExpenses = crop.expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
                            const statusColors = {
                                active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
                                harvested: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
                                sold: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                            };
                            const statusColor = statusColors[crop.status] || statusColors.active;

                            return (
                                <div
                                    key={crop._id}
                                    onClick={() => navigate(`/crop/${crop._id}`)}
                                    className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 dark:bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                                    
                                    <div className="relative z-10 flex justify-between items-start mb-6">
                                        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${statusColor} uppercase tracking-wider`}>
                                            {crop.status}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50 px-2 py-1 rounded-md">
                                            <Calendar className="w-3.5 h-3.5" /> 
                                            {new Date(crop.sowingDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-800/40 border border-green-200 dark:border-green-800/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                            {crop.status === 'sold' ? <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-500" /> : <Sprout className="w-7 h-7 text-green-600 dark:text-green-500" />}
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-xl text-slate-800 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-1">{crop.cropName}</h3>
                                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">{crop.area} Acres</p>
                                        </div>
                                    </div>

                                    <div className="relative z-10 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Total Expenses</p>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                ₹{totalExpenses.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center group-hover:bg-green-50 dark:group-hover:bg-green-900/50 transition-colors">
                                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
};

export default MyCrops;
