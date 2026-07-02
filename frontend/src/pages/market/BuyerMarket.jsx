import { useEffect, useState } from "react";
import api from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { Phone, MapPin, ShoppingBag, Filter } from "lucide-react";
import { useTranslation } from "react-i18next"; // 1. Import Hook
import PageHeader from "../../components/common/PageHeader";
import SearchInput from "../../components/common/SearchInput";

const BuyerMarket = () => {
    const { t } = useTranslation(); // 2. Initialize Hook
    const navigate = useNavigate();
    const [listings, setListings] = useState([]);
    const [filteredListings, setFilteredListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const { data } = await api.get("/crops/market/listings");
                setListings(data);
                setFilteredListings(data);
            } catch (err) {
                console.error(err);
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
                item.cropName.toLowerCase().includes(lowerTerm) ||
                item.user?.village?.toLowerCase().includes(lowerTerm) ||
                item.user?.district?.toLowerCase().includes(lowerTerm)
            );
            setFilteredListings(filtered);
        }
    }, [searchTerm, listings]);

    return (
        // 👇 FIX: Removed 'min-h-screen', 'bg-agriBg', 'pb-20' (App.jsx handles this now)
        <div className="w-full">

            {/* Header */}
            <PageHeader title={t('market.title')} icon={ShoppingBag}>
                <div className="mt-2 mb-2 md:mt-4 md:mb-2">
                    <SearchInput
                        placeholder={t('market.search', { defaultValue: "Search by crop, village..." })}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </PageHeader>

            {/* Listings Grid */}
            <div className="p-4 max-w-2xl mx-auto">
                {loading ? (
                    <div className="space-y-4 mt-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-xl animate-pulse border border-gray-200"></div>)}
                    </div>
                ) : filteredListings.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Filter className="w-8 h-8 text-orange-300" />
                        </div>
                        {/* Translated Empty State */}
                        <p className="text-gray-500 font-medium">{t('market.no_crops')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredListings.map(item => (
                            <div key={item._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition group">

                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-xl text-gray-800">{item.cropName}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-md">
                                                Qty: {item.quantityAvailable} Qtl
                                            </span>
                                            <span className="text-xs font-medium text-gray-400">
                                                {new Date(item.updatedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-orange-600">₹{item.expectedPrice}</p>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Per Quintal</p>
                                    </div>
                                </div>

                                {item.description && (
                                    <p className="text-gray-600 text-sm mb-4 bg-agriBg p-2 rounded-lg border border-gray-100">
                                        "{item.description}"
                                    </p>
                                )}

                                <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-100">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin className="w-4 h-4 text-orange-500" />
                                        <span className="font-medium">
                                            {item.user?.village || "Unknown Village"}, {item.user?.district || "District"}
                                        </span>
                                    </div>
                                    <a
                                        href={`tel:${item.user?.phone}`}
                                        className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-green-700 active:scale-95 transition shadow-sm"
                                    >
                                        {/* Translated Call Button */}
                                        <Phone className="w-4 h-4" /> {t('market.call_farmer')}
                                    </a>
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
