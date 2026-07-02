import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, BarChart3, Users, Sprout, ArrowRight } from "lucide-react";
import ThemeToggle from "../../components/ThemeToggle";

const AdminLanding = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
            {/* Header */}
            <header className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-8 h-8 text-primary" />
                    <span className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">AgriSpine<span className="text-primary">Admin</span></span>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <button onClick={() => navigate("/login")} className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">
                        Login
                    </button>
                    <button onClick={() => navigate("/register")} className="text-sm font-bold bg-primary text-white px-5 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:bg-primary-hover transition-all transform hover:-translate-y-0.5">
                        Register Admin
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-light text-primary-dark font-medium text-sm mb-8 shadow-sm">
                    <Sprout className="w-4 h-4" />
                    <span>Empowering the Agricultural Backbone</span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
                    Manage the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">AgriSpine</span> Ecosystem.
                </h1>
                
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mb-12">
                    Centralized control center for monitoring market rates, curating government schemes, and overseeing the community network of farmers.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-20">
                    <button onClick={() => navigate("/login")} className="flex items-center justify-center gap-2 text-lg font-bold bg-primary text-white px-8 py-4 rounded-full shadow-xl hover:shadow-2xl hover:bg-primary-hover transition-all transform hover:-translate-y-1">
                        Go to Dashboard <ArrowRight className="w-5 h-5" />
                    </button>
                    <button onClick={() => navigate("/register")} className="flex items-center justify-center gap-2 text-lg font-bold bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 px-8 py-4 rounded-full shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                        Create Account
                    </button>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                            <BarChart3 className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Mandi Rates</h3>
                        <p className="text-gray-600 dark:text-gray-400">Update and broadcast real-time market prices across regions securely.</p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-6">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Govt Schemes</h3>
                        <p className="text-gray-600 dark:text-gray-400">Curate and manage central and state government schemes for farmers.</p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">Community</h3>
                        <p className="text-gray-600 dark:text-gray-400">Oversee users, groups, polls, and announcements from a single interface.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLanding;
