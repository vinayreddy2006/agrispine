import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Sprout, TrendingUp, Users, User, Briefcase } from "lucide-react";

const BottomNav = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    // Define the tabs with translated names
    const tabs = [
        { key: "home", name: t("nav.home", "Home"), path: "/dashboard", icon: <Home className="w-6 h-6" /> },
        { key: "crops", name: t("nav.crops", "Crops"), path: "/my-crops", icon: <Sprout className="w-6 h-6" /> },
        { key: "market", name: t("nav.market", "Market"), path: "/market", icon: <TrendingUp className="w-6 h-6" /> },
        { key: "forum", name: t("nav.forum", "Forum"), path: "/community", icon: <Users className="w-6 h-6" /> },
        { key: "groups", name: t("nav.groups", "Groups"), path: "/groups", icon: <Briefcase className="w-6 h-6" /> },
        { key: "profile", name: t("nav.profile", "Profile"), path: "/profile", icon: <User className="w-6 h-6" /> },
    ];

    // Don't show nav on Login, Register, or Landing pages
    const hideOnPaths = ["/", "/login", "/register", "/messages"];
    if (hideOnPaths.includes(location.pathname)) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 pb-safe transition-colors">
            <div className="flex justify-around items-center px-2 py-3 max-w-6xl mx-auto">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => navigate(tab.path)}
                            className={`flex flex-col items-center justify-center w-full space-y-1 transition-colors duration-200
                ${isActive ? "text-green-600 dark:text-green-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
                        >
                            <div className={`p-1 rounded-xl transition-all ${isActive ? "bg-green-50 dark:bg-green-950/40" : ""}`}>
                                {tab.icon}
                            </div>
                            <span className="text-[10px] font-bold tracking-wide">{tab.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
