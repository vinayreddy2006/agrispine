import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, MapPin, Filter, Minus, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import SearchInput from "../../components/common/SearchInput";
import api from "../../utils/api";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

const MarketPrices = () => {
    const { t } = useTranslation(); // 2. Initialize Hook
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("All");
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrices = async () => {
            setLoading(true);
            try {
                const { data } = await api.get("/admin/mandi-rates");
                setPrices(data);
            } catch (err) {
                console.error("Failed to fetch mandi rates:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPrices();
    }, []);

    // --- FILTER LOGIC ---
    const filteredPrices = prices.filter((item) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = item.crop.toLowerCase().includes(term) ||
            item.market.toLowerCase().includes(term);
        const matchesDistrict = selectedDistrict === "All" || item.market === selectedDistrict;
        return matchesSearch && matchesDistrict;
    });

    const districts = ["All", ...new Set(prices.map(p => p.market))].sort();

    return (
        <div className="w-full h-full pb-20">
            <PageHeader
                title={t('dashboard.mandi_rates', { defaultValue: 'Mandi Rates' })}
                icon={TrendingUp}
            />

            {/* Content */}
            <div className="p-4 relative z-10 space-y-4">
                {/* Search Bar */}
                <div className="bg-white p-2 rounded-xl shadow-lg flex flex-col md:flex-row gap-2">
                    <div className="flex-1">
                        <SearchInput
                            placeholder={t('market.search', { defaultValue: "Search 'Cotton' or 'Warangal'..." })}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="h-px md:h-auto md:w-px bg-gray-200 mx-2"></div>
                    <div className="md:w-1/4 relative">
                        <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <select
                            className="w-full pl-10 pr-4 py-2.5 border-none rounded-lg bg-transparent outline-none cursor-pointer text-gray-700 font-medium hover:bg-agriBg transition"
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                        >
                            {districts.map(d => <option key={d} value={d}>{d === "All" ? t('market.all_mandis', { defaultValue: 'All Mandis' }) : d}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* --- TABLE CONTENT --- */}
            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-64">
                        <RefreshCw className="w-8 h-8 animate-spin mb-2 text-green-600" />
                        <p>{t('loading', { defaultValue: 'Loading market rates...' })}</p>
                    </div>
                ) : filteredPrices.length === 0 ? (
                    <EmptyState
                        title={t('market.no_crops', { defaultValue: 'No Market Prices Found' })}
                        description="Market prices for the selected region will appear here when published."
                        icon={Filter}
                        actionText={t('market.clear', { defaultValue: 'Clear Search' })}
                        onAction={() => { setSearchTerm(""); setSelectedDistrict("All"); }}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-agriBg border-b border-gray-200">
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('market.col_crop', { defaultValue: 'Crop Name' })}</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('market.col_market', { defaultValue: 'Market' })}</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">{t('market.col_price', { defaultValue: 'Modal Price' })}</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">{t('market.col_trend', { defaultValue: 'Trend' })}</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right hidden md:table-cell">{t('market.col_range', { defaultValue: 'Range (Min-Max)' })}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredPrices.map((item) => (
                                    <tr key={item._id} className="hover:bg-green-50/50 transition duration-150 cursor-default">

                                        {/* Crop Name */}
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-gray-800">{item.crop}</div>
                                            <div className="text-xs text-gray-400 font-medium">{item.type}</div>
                                        </td>

                                        {/* Market */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-1.5 text-gray-600 text-sm font-medium">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400" /> {item.market}
                                            </div>
                                        </td>

                                        {/* Modal Price */}
                                        <td className="py-4 px-6 text-right">
                                            <div className="text-lg font-bold text-gray-900">₹{item.modal.toLocaleString()}</div>
                                            <div className="text-[10px] text-gray-400">{t('market.per_qtl', { defaultValue: 'per Quintal' })}</div>
                                        </td>

                                        {/* Trend Badge */}
                                        <td className="py-4 px-6 text-center">
                                            {item.trend === "up" && (
                                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold">
                                                    <TrendingUp className="w-3 h-3" /> {t('market.rising', { defaultValue: 'Rising' })}
                                                </span>
                                            )}
                                            {item.trend === "down" && (
                                                <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold">
                                                    <TrendingDown className="w-3 h-3" /> {t('market.falling', { defaultValue: 'Falling' })}
                                                </span>
                                            )}
                                            {item.trend === "stable" && (
                                                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold">
                                                    <Minus className="w-3 h-3" /> {t('market.stable', { defaultValue: 'Stable' })}
                                                </span>
                                            )}
                                        </td>

                                        {/* Range (Hidden on small mobile) */}
                                        <td className="py-4 px-6 text-right hidden md:table-cell">
                                            <div className="text-sm font-medium text-gray-600">₹{item.min.toLocaleString()} - ₹{item.max.toLocaleString()}</div>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="text-center mt-6 text-xs text-gray-400 flex items-center justify-center gap-1">
                <RefreshCw className="w-3 h-3" />
                {t('market.updated_daily', { defaultValue: 'Prices updated daily at 08:00 AM based on Mandi arrivals.' })}
            </div>
        </div>
    );
};

export default MarketPrices;
