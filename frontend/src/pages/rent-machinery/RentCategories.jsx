import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Tractor, ChevronRight, Plus, ClipboardList, Settings, PlusCircle, Search } from "lucide-react";
import { useTranslation } from "react-i18next"; // 1. Import Hook
import LanguageSwitcher from "../../components/LanguageSwitcher"; // 2. Import Switcher
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

// Matches your "Add Machine" dropdown exactly
const CATEGORIES = [
    { name: "Tractor", img: "/machines/tractor.png", color: "group-hover:text-blue-600" },
    { name: "Harvester", img: "/machines/harvestor.png", color: "group-hover:text-green-600" },
    { name: "Rotavator", img: "/machines/rotavator.png", color: "group-hover:text-red-600" },
    { name: "Drone", img: "/machines/drone_spray.png", color: "group-hover:text-purple-600" },
    { name: "JCB", img: "/machines/jcb.png", color: "group-hover:text-yellow-600" },
    { name: "Rice Planter", img: "/machines/rice_planter.png", color: "group-hover:text-teal-600" },
    { name: "Dozer", img: "/machines/dozer.png", color: "group-hover:text-orange-600" },
    { name: "Baler", img: "/machines/baler.png", color: "group-hover:text-indigo-600" },
    { name: "Ridger", img: "/machines/ridger.png", color: "group-hover:text-pink-600" },
];

const RentCategories = () => {
    const { t } = useTranslation(); // 3. Initialize Hook
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = React.useState("");

    const filteredCategories = CATEGORIES.filter(cat => 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t(`machines.${cat.name.toLowerCase().replace(" ", "_")}`, { defaultValue: cat.name }).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-agriBg pb-24 relative">

            {/* --- HEADER --- */}
            <PageHeader 
                title={t('rent.title')}
                icon={Tractor}
                rightActions={
                    <>
                        <LanguageSwitcher />

                        <button
                            onClick={() => navigate("/add-machine")}
                            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white shadow-md hover:bg-green-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5 min-h-[44px]"
                            title={t('rent.list')}
                        >
                            <PlusCircle className="w-5 h-5" />
                            <span className="font-bold text-sm">{t('rent.list')}</span>
                        </button>

                        <button
                            onClick={() => navigate("/my-machines")}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-agriBg text-gray-700 border border-gray-200 hover:bg-gray-100 hover:text-green-600 transition shadow-sm min-h-[44px] min-w-[44px] justify-center"
                            title={t('rent.my_machines')}
                        >
                            <Settings className="w-5 h-5" />
                            <span className="hidden md:inline font-semibold text-sm">{t('rent.my_machines')}</span>
                        </button>

                        <button
                            onClick={() => navigate("/my-bookings")}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition shadow-sm min-h-[44px] min-w-[44px] justify-center"
                            title={t('rent.my_req')}
                        >
                            <ClipboardList className="w-5 h-5" />
                            <span className="hidden md:inline font-semibold text-sm">{t('rent.my_req')}</span>
                        </button>
                    </>
                }
            />

            {/* --- HERO SEARCH SECTION --- */}
            <div className="bg-gradient-to-b from-green-600 to-green-700 text-white px-4 py-12 md:py-20 mb-8 rounded-b-3xl shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight drop-shadow-md">
                        {t('rent.hero_title', { defaultValue: 'Rent Machinery for Your Farm' })}
                    </h1>
                    <p className="text-green-50 mb-8 md:text-lg max-w-2xl mx-auto drop-shadow">
                        {t('rent.hero_subtitle', { defaultValue: 'Find the right equipment for your needs from verified providers near you.' })}
                    </p>
                    
                    <div className="relative max-w-2xl mx-auto">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Search className="h-6 w-6 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder={t('rent.search_placeholder', { defaultValue: 'Search machinery (e.g., Tractor, Drone...)' })}
                            className="w-full !pl-14 pr-4 py-4 rounded-2xl text-gray-800 focus:outline-none focus:ring-4 focus:ring-green-400/50 shadow-2xl text-lg border-0"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* --- GRID CONTENT --- */}
            <div className="max-w-7xl mx-auto p-4 md:p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {filteredCategories.length > 0 ? filteredCategories.map((cat) => (
                        <div
                            key={cat.name}
                            onClick={() => navigate(`/rent/list/${cat.name}`)}
                            className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden"
                        >
                            {/* Image Container */}
                            <div className="w-full h-28 md:h-40 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                                <img src={cat.img} alt={cat.name} className="w-full h-full object-contain drop-shadow-sm" />
                            </div>

                            {/* Text */}
                            <div className="text-center">
                                <h3 className={`font-bold text-gray-800 text-lg transition-colors ${cat.color}`}>
                                    {/* Dynamic Translation: 'machines.tractor', 'machines.rice_planter' */}
                                    {t(`machines.${cat.name.toLowerCase().replace(" ", "_")}`, { defaultValue: cat.name })}
                                </h3>
                                <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium uppercase tracking-wide">
                                    View <ChevronRight className="w-3 h-3" />
                                </p>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full">
                            <EmptyState 
                                title="No Categories Found"
                                description="Try adjusting your search terms."
                                icon={Search}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* --- FIXED FAB (Mobile Only) --- */}
            <button
                onClick={() => navigate("/add-machine")}
                className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-xl shadow-green-200 flex items-center justify-center z-30 transition-transform active:scale-95"
                title={t('rent.list')}
            >
                <Plus className="w-8 h-8" strokeWidth={2.5} />
            </button>

        </div>
    );
};

export default RentCategories;