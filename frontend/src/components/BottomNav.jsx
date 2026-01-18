import { useLocation, useNavigate } from "react-router-dom";
import { Home, Sprout, TrendingUp, Users, User } from "lucide-react";

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Define the tabs
    const tabs = [
        { name: "Home", path: "/dashboard", icon: <Home className="w-6 h-6" /> },
        { name: "Crops", path: "/my-crops", icon: <Sprout className="w-6 h-6" /> }, // Or a My Crops list page
        { name: "Market", path: "/market", icon: <TrendingUp className="w-6 h-6" /> },
        { name: "Forum", path: "/community", icon: <Users className="w-6 h-6" /> },
        { name: "Profile", path: "/profile", icon: <User className="w-6 h-6" /> },
    ];

    // Don't show nav on Login, Register, or Landing pages
    const hideOnPaths = ["/", "/login", "/register", "/village-chat"];
    if (hideOnPaths.includes(location.pathname)) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 pb-safe">
            <div className="flex justify-around items-center px-2 py-3 max-w-6xl mx-auto">
                {tabs.map((tab) => {
                    const isActive = location.pathname === tab.path;
                    return (
                        <button
                            key={tab.name}
                            onClick={() => navigate(tab.path)}
                            className={`flex flex-col items-center justify-center w-full space-y-1 transition-colors duration-200
                ${isActive ? "text-green-600" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            <div className={`p-1 rounded-xl transition-all ${isActive ? "bg-green-50" : ""}`}>
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