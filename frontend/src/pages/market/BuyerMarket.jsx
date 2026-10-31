import { useEffect, useState } from "react";
import api from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { Phone, MapPin, ShoppingBag, Filter, Calendar, Tag, ShieldCheck, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";
import EmptyState from "../../components/ui/EmptyState";

const BuyerMarket = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [listings, setListings] = useState([]);
    const [filteredListings, setFilteredListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const { data } = await api.get("/crops/market/listings");
                setListings(Array.isArray(data) ? data : []);
                setFilteredListings(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch market listings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchListings();
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredListings(listings);
        } else {
            const lowerTerm = searchTerm.toLowerCase();
            const filtered = listings.filter(item =>
                (item.cropName || '').toLowerCase().includes(lowerTerm) ||
                (item.user?.village || '').toLowerCase().includes(lowerTerm) ||
                (item.user?.district || '').toLowerCase().includes(lowerTerm) ||
                (item.user?.name || '').toLowerCase().includes(lowerTerm)
            );
            setFilteredListings(filtered);
        }
    }, [searchTerm, listings]);

    return (
        <div className="w-full pb-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
            <PageHeader title={t('market.title', { defaultValue: "Direct Farm Market" })} icon={ShoppingBag}>
                <div className="mt-3 mb-2 max-w-xl">
                    <SearchInput
                        placeholder={t('market.search', { defaultValue: "Search by crop name, farmer, or village..." })}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </PageHeader>

            <div className="p-4 md:p-6 max-w-5xl mx-auto">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-44 bg-white dark:bg-slate-900 rounded-3xl animate-pulse border border-slate-200 dark:border-slate-800"></div>
                        ))}
                    </div>
                ) : filteredListings.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800">
                        <EmptyState 
                            title={t('market.no_crops', { defaultValue: "No crops available in the market" })}
                            description="Farm produce listed by local farmers for sale will appear here."
                            icon={ShoppingBag}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {filteredListings.map(item => (
                            <div 
                                key={item._id} 
                                className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start gap-3 mb-3">
                                        <div>
                                            <h3 className="font-bold text-xl text-slate-900 dark:text-white">
                                                {item.cropName}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                                                    Qty: {item.quantityAvailable} Quintals
                                                </span>
                                                <span className="text-[11px] font-medium text-slate-400">
                                                    {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right bg-emerald-50/60 dark:bg-emerald-950/30 px-3 py-2 rounded-2xl border border-emerald-150">
                                            <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">₹{item.expectedPrice}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">/ Quintal</p>
                                        </div>
                                    </div>

                                    {item.description && (
                                        <p className="text-slate-600 dark:text-slate-400 text-xs mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 leading-relaxed italic">
                                            "{item.description}"
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                        <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                        <span className="font-semibold truncate max-w-[170px]">
                                            {[item.user?.village, item.user?.district].filter(Boolean).join(", ") || "Local Farmer"}
                                        </span>
                                    </div>

                                    {item.user?.phone && (
                                        <a
                                            href={`tel:${item.user.phone}`}
                                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-700 active:scale-95 transition shadow-sm"
                                        >
                                            <Phone className="w-3.5 h-3.5" />
                                            <span>{t('market.call_farmer', { defaultValue: "Contact Farmer" })}</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BuyerMarket;
