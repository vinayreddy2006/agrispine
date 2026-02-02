import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Tractor, ChevronRight, Plus, ClipboardList, Settings, PlusCircle } from "lucide-react";
import { useTranslation } from "react-i18next"; // 1. Import Hook
import LanguageSwitcher from "../../components/LanguageSwitcher"; // 2. Import Switcher

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

    return (
        <div className="min-h-screen bg-gray-50 pb-24 relative">

            {/* --- HEADER --- */}
            <div className="bg-white/90 backdrop-blur-sm shadow-sm p-4 sticky top-0 z-20 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-2 flex justify-between items-center">

                    {/* Left: Title */}
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate("/dashboard")} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6 text-gray-700" />
                        </button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Tractor className="text-green-600 w-6 h-6 md:w-8 md:h-8" />
                                {t('rent.title')}
                            </h1>
                        </div>
                    </div>

                    {/* Center: Language Switcher */}
                    <div className="hidden sm:block">
                        <LanguageSwitcher />
                    </div>

                    {/* Right: Actions */}
                    <div className="flex gap-3 items-center">
                        {/* Mobile Language Switcher (Visible only on small screens) */}
                        <div className="sm:hidden">
                            <LanguageSwitcher />
                        </div>

                        {/* List Machine Button */}
                        <button
                            onClick={() => navigate("/add-machine")}
                            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white shadow-md hover:bg-green-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                            title={t('rent.list')}
                        >
                            <PlusCircle className="w-5 h-5" />
                            <span className="font-bold text-sm">{t('rent.list')}</span>
                        </button>

                        {/* My Machines */}
                        <button
                            onClick={() => navigate("/my-machines")}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:text-green-600 transition shadow-sm"
                            title={t('rent.my_machines')}
                        >
                            <Settings className="w-5 h-5" />
                            <span className="hidden md:inline font-semibold text-sm">{t('rent.my_machines')}</span>
                        </button>

                        {/* My Requests */}
                        <button
                            onClick={() => navigate("/my-bookings")}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition shadow-sm"
                            title={t('rent.my_req')}
                        >
                            <ClipboardList className="w-5 h-5" />
                            <span className="hidden md:inline font-semibold text-sm">{t('rent.my_req')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- GRID CONTENT --- */}
            <div className="max-w-7xl mx-auto p-4 md:p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {CATEGORIES.map((cat) => (
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
                    ))}
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