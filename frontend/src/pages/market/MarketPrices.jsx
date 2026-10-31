import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, MapPin, Filter, Minus, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import SearchInput from "../../components/common/SearchInput";
import api from "../../utils/api";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import NoSearchResults from "../../components/ui/NoSearchResults";
import { TableRowSkeleton } from "../../components/ui/LoadingSkeleton";

const MarketPrices = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("All");
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPrices = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get("/admin/mandi-rates");
            setPrices(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch mandi rates:", err);
            setError("Unable to connect to the Agricultural Produce Market Committee (APMC) mandi rate service.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
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

    const isFiltered = searchTerm.trim().length > 0 || selectedDistrict !== "All";

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedDistrict("All");
    };

    return (
        <div className="w-full h-full pb-20">
            <PageHeader
                title={t('dashboard.mandi_rates', { defaultValue: 'Mandi Rates' })}
                icon={TrendingUp}
            />

            {/* Content */}
            <div className="p-4 relative z-10 space-y-4">
                {/* Search Bar */}
                <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-xs border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row gap-2">
                    <div className="flex-1">
                        <SearchInput
                            placeholder={t('market.search', { defaultValue: "Search 'Cotton' or 'Warangal'..." })}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="h-px md:h-auto md:w-px bg-gray-200 dark:bg-slate-700 mx-2"></div>
                    <div className="md:w-1/4 relative">
                        <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5 pointer-events-none" />
                        <select
                            className="w-full pl-10 pr-4 py-2.5 border-none rounded-lg bg-transparent outline-none cursor-pointer text-gray-700 dark:text-gray-200 font-medium hover:bg-agriBg dark:hover:bg-slate-700/50 transition"
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                        >
                            {districts.map(d => (
                                <option key={d} value={d} className="bg-white dark:bg-slate-800">
                                    {d === "All" ? t('market.all_mandis', { defaultValue: 'All Mandis' }) : d}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* --- TABLE CONTENT --- */}
            <div className="bg-surface dark:bg-slate-800 rounded-xl shadow-xs border border-border dark:border-slate-700 overflow-hidden mx-4 min-h-[360px]">
                {loading ? (
                    <div className="p-6">
                        <TableRowSkeleton rows={6} cols={5} />
                    </div>
                ) : error ? (
                    <div className="p-8">
                        <ErrorState
                            title="Failed to Load Mandi Rates"
                            message={error}
                            onRetry={fetchPrices}
                        />
                    </div>
                ) : isFiltered && filteredPrices.length === 0 ? (
                    <div className="p-8">
                        <NoSearchResults
                            query={searchTerm ? `"${searchTerm}" in ${selectedDistrict}` : selectedDistrict}
                            onClear={clearFilters}
                            suggestions={[
                                "Check the spelling of the commodity name (e.g., Paddy, Cotton, Chilli)",
                                "Switch the market dropdown to 'All Mandis' to see prices across regions",
                                "Clear your filters to view today's complete APMC price bulletin"
                            ]}
                        />
                    </div>
                ) : prices.length === 0 ? (
                    <div className="p-8">
                        <EmptyState
                            title={t('market.no_crops', { defaultValue: 'No Market Prices Available Today' })}
                            description="Daily mandi auction prices are updated between 10:00 AM and 2:00 PM on working days."
                            tip="Prices reflect verified modal auction rates from Telangana and Andhra Pradesh APMC yards."
                            icon={Filter}
                            actionText="Refresh Rates"
                            onAction={fetchPrices}
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-agriBg dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('market.col_crop', { defaultValue: 'Crop Name' })}</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('market.col_market', { defaultValue: 'Market' })}</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">{t('market.col_price', { defaultValue: 'Modal Price' })}</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">{t('market.col_trend', { defaultValue: 'Trend' })}</th>
                                    <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right hidden md:table-cell">{t('market.col_range', { defaultValue: 'Range (Min-Max)' })}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60">
                                {filteredPrices.map((item) => (
                                    <tr key={item._id} className="hover:bg-green-50/50 dark:hover:bg-slate-700/30 transition duration-150 cursor-default">

                                        {/* Crop Name */}
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-gray-800 dark:text-gray-100">{item.crop}</div>
                                            <div className="text-xs text-gray-400 font-medium">{item.type}</div>
                                        </td>

                                        {/* Market */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 text-sm font-medium">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400" /> {item.market}
                                            </div>
                                        </td>

                                        {/* Modal Price */}
                                        <td className="py-4 px-6 text-right">
                                            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">₹{item.modal.toLocaleString()}</div>
                                            <div className="text-[10px] text-gray-400">{t('market.per_qtl', { defaultValue: 'per Quintal' })}</div>
                                        </td>

                                        {/* Trend Badge */}
                                        <td className="py-4 px-6 text-center">
                                            {item.trend === "up" && (
                                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-1 rounded-full text-xs font-bold">
                                                    <TrendingUp className="w-3 h-3" /> {t('market.rising', { defaultValue: 'Rising' })}
                                                </span>
                                            )}
                                            {item.trend === "down" && (
                                                <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 px-2.5 py-1 rounded-full text-xs font-bold">
                                                    <TrendingDown className="w-3 h-3" /> {t('market.falling', { defaultValue: 'Falling' })}
                                                </span>
                                            )}
                                            {item.trend === "stable" && (
                                                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300 px-2.5 py-1 rounded-full text-xs font-bold">
                                                    <Minus className="w-3 h-3" /> {t('market.stable', { defaultValue: 'Stable' })}
                                                </span>
                                            )}
                                        </td>

                                        {/* Min - Max Range */}
                                        <td className="py-4 px-6 text-right hidden md:table-cell">
                                            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                                ₹{item.min.toLocaleString()} - ₹{item.max.toLocaleString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketPrices;
