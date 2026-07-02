import React, { useState } from "react";
import { Outlet, Navigate, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, TrendingUp, LogOut, Users, MessageSquare, BarChart2, Megaphone, Calendar, Menu, X } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const token = localStorage.getItem("admin-token");
    
    let admin = {};
    try {
        admin = JSON.parse(localStorage.getItem("admin-user") || "{}");
    } catch (e) {
        admin = {};
    }

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const handleLogout = () => {
        localStorage.removeItem("admin-token");
        localStorage.removeItem("admin-user");
        navigate("/login");
    };

    const navItems = [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/users", label: "Users", icon: Users },
        { path: "/groups", label: "Groups", icon: MessageSquare },
        { path: "/polls", label: "Polls", icon: BarChart2 },
        { path: "/announcements", label: "Announcements", icon: Megaphone },
        { path: "/events", label: "Events", icon: Calendar },
        { path: "/schemes", label: "Govt Schemes", icon: FileText },
        { path: "/mandi-rates", label: "Mandi Rates", icon: TrendingUp },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors duration-200">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-50 transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:static`}>
                {/* Logo Area */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-green-700">AgriSpine <span className="text-gray-800 dark:text-white">Admin</span></h2>
                    <button className="lg:hidden text-gray-500" onClick={() => setIsSidebarOpen(false)}>
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => { navigate(item.path); setIsSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                                    isActive 
                                        ? "bg-green-600 text-white font-medium shadow-sm" 
                                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
                {/* Logout */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header Navbar */}
                <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" onClick={() => setIsSidebarOpen(true)}>
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800 dark:text-white capitalize hidden sm:block">
                            {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        
                        {/* Profile placeholder */}
                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 py-1.5 px-3 rounded-full border border-gray-200 dark:border-gray-700">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                                {admin?.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                            </div>

                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
                                {admin?.name || 'Admin'}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
