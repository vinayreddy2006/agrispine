import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, Search, MapPin, Filter, Minus, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next"; // 1. Import Hook

const MarketPrices = () => {
    const { t } = useTranslation(); // 2. Initialize Hook
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("All");
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- MOCK DATA GENERATOR ---
    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            const crops = [
                { name: "Cotton (Long Staple)", min: 6800, max: 7600, type: "Fiber" },
                { name: "Red Chilli (Teja)", min: 18500, max: 23000, type: "Spice" },
                { name: "Paddy (Common)", min: 2100, max: 2350, type: "Grain" },
                { name: "Turmeric", min: 6500, max: 7900, type: "Spice" },
                { name: "Maize", min: 1900, max: 2200, type: "Grain" },
                { name: "Groundnut", min: 5500, max: 6200, type: "Oilseed" },
                { name: "Soybean", min: 4600, max: 5300, type: "Oilseed" },
                { name: "Bengal Gram", min: 4800, max: 5400, type: "Pulse" },
                { name: "Green Gram", min: 7000, max: 7800, type: "Pulse" },
                { name: "Tomato", min: 800, max: 1500, type: "Vegetable" },
                { name: "Onion", min: 1200, max: 2500, type: "Vegetable" }
            ];

            const markets = [
                "Warangal", "Khammam", "Nizamabad", "Karimnagar", "Mahabubnagar",
                "Siddipet", "Adilabad", "Nalgonda", "Suryapet", "Jagtial",
                "Badepally", "Kesamudram", "Jangaon", "Gajwel"
            ];

            const generatedData = [];

            for (let i = 1; i <= 50; i++) {
                const randomCrop = crops[Math.floor(Math.random() * crops.length)];
                const randomMarket = markets[Math.floor(Math.random() * markets.length)];
                const fluctuation = Math.floor(Math.random() * 500) - 250;
                const modalPrice = Math.floor((randomCrop.min + randomCrop.max) / 2) + fluctuation;

                const trendRandom = Math.random();
                let trend = "stable";
                if (trendRandom > 0.6) trend = "up";
                if (trendRandom < 0.3) trend = "down";

                generatedData.push({
                    id: i,
                    market: randomMarket,
                    crop: randomCrop.name,
                    type: randomCrop.type,
                    min: randomCrop.min + fluctuation,
                    max: randomCrop.max + fluctuation,
                    modal: modalPrice,
                    trend: trend,
                    date: new Date().toLocaleDateString()
                });
            }
            setPrices(generatedData);
            setLoading(false);
        }, 800);
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
        <div className="w-full">

            {/* --- HEADER --- */}
            <div className="bg-gradient-to-r from-green-700 to-green-600 pb-10 pt-6 px-6 shadow-md sticky top-0 z-30">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-3 text-white mb-6">
                        <button onClick={() => navigate("/dashboard")} className="p-2 -ml-2 hover:bg-white/20 rounded-full transition">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                {/* Translated Title */}
                                <TrendingUp className="w-7 h-7" /> {t('dashboard.mandi_rates')}
                            </h1>
                            <p className="text-green-100 text-sm opacity-90">{t('dashboard.mandi_desc')}</p>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-white p-2 rounded-xl shadow-lg flex flex-col md:flex-row gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                // Translated Placeholder
                                placeholder={t('market.search', { defaultValue: "Search 'Cotton' or 'Warangal'..." })}
                                className="w-full pl-10 pr-4 py-2.5 border-none rounded-lg focus:ring-0 text-gray-700 placeholder-gray-400 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="h-px md:h-auto md:w-px bg-gray-200 mx-2"></div>
                        <div className="md:w-1/4 relative">
                            <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                            <select
                                className="w-full pl-10 pr-4 py-2.5 border-none rounded-lg bg-transparent outline-none cursor-pointer text-gray-700 font-medium hover:bg-gray-50 transition"
                                value={selectedDistrict}
                                onChange={(e) => setSelectedDistrict(e.target.value)}
                            >
                                {districts.map(d => <option key={d} value={d}>{d === "All" ? t('market.all_mandis', { defaultValue: 'All Mandis' }) : d}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- TABLE CONTENT --- */}
            <div className="max-w-6xl mx-auto w-full px-4 mt-6 pb-32 relative z-10 flex-1">

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-64">
                            <RefreshCw className="w-8 h-8 animate-spin mb-2 text-green-600" />
                            <p>{t('loading', { defaultValue: 'Loading market rates...' })}</p>
                        </div>
                    ) : filteredPrices.length === 0 ? (
                        <div className="p-12 text-center">
                            <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-gray-600 font-medium">{t('market.no_crops')}</h3>
                            <button onClick={() => { setSearchTerm(""); setSelectedDistrict("All"); }} className="text-green-600 font-bold hover:underline mt-1 text-sm">
                                {t('market.clear', { defaultValue: 'Clear Search' })}
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('market.col_crop', { defaultValue: 'Crop Name' })}</th>
                                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('market.col_market', { defaultValue: 'Market' })}</th>
                                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">{t('market.col_price', { defaultValue: 'Modal Price' })}</th>
                                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">{t('market.col_trend', { defaultValue: 'Trend' })}</th>
                                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right hidden md:table-cell">{t('market.col_range', { defaultValue: 'Range (Min-Max)' })}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredPrices.map((item) => (
                                        <tr key={item.id} className="hover:bg-green-50/50 transition duration-150 cursor-default">

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
        </div>
    );
};

export default MarketPrices;