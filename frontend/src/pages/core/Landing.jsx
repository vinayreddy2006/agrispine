import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, TrendingUp, Tractor, Users, ArrowRight, ShieldCheck, Leaf, MessageSquare, Briefcase, Calendar, MapPin, IndianRupee, Bot, ChevronRight, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import ThemeToggle from "../../components/ThemeToggle";

// Mock Components for Interactive Showcase
const GramSathiMock = () => (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 h-full w-full flex flex-col overflow-hidden shadow-2xl relative min-h-[400px]">
        <div className="bg-white dark:bg-slate-950 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
                <h3 className="font-bold text-slate-800 dark:text-white">GramSathi AI</h3>
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">Online • Farm Assistant</p>
            </div>
        </div>
        <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
            <div className="flex justify-end animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="bg-green-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 max-w-[80%] shadow-md">
                    <p className="text-sm">What should I spray for leaf curl disease on my tomatoes?</p>
                </div>
            </div>
            <div className="flex gap-3 animate-in fade-in slide-in-from-left-4 duration-700 delay-300 fill-mode-both">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-sm px-5 py-4 max-w-[85%] shadow-sm">
                    <p className="text-sm leading-relaxed mb-3">
                        Leaf curl in tomatoes is typically caused by the Tomato Yellow Leaf Curl Virus (TYLCV), spread by whiteflies.
                    </p>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3 text-xs mb-3">
                        <span className="font-bold text-amber-800 dark:text-amber-400">Recommendation:</span> Use Neem oil (5ml/L) or Imidacloprid (0.5ml/L) to control the whitefly vectors.
                    </div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">Buy Pesticide</button>
                        <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">Log Expense</button>
                    </div>
                </div>
            </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-full h-10 px-4 flex items-center">
                <span className="text-sm text-slate-400">Ask in any language...</span>
            </div>
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-green-700 transition-colors">
                <ArrowRight className="w-5 h-5" />
            </div>
        </div>
    </div>
);

const WorkGroupsMock = () => (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 h-full w-full p-6 flex flex-col gap-6 shadow-2xl relative overflow-hidden min-h-[400px]">
        <div className="flex justify-between items-center">
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Ramesh's Labor Group</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3"/> Kodad, Telangana</p>
            </div>
            <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 z-10 flex items-center justify-center overflow-hidden">
                        <Users className="w-4 h-4 text-slate-400" />
                    </div>
                ))}
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 font-bold uppercase">Total Group Earnings</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-500 flex items-center mt-1">
                    <IndianRupee className="w-5 h-5" /> 45,500
                </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 font-bold uppercase">Pending Settlement</p>
                <p className="text-2xl font-bold text-amber-500 flex items-center mt-1">
                    <IndianRupee className="w-5 h-5" /> 12,000
                </p>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex-1 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-bold text-sm text-slate-700 dark:text-slate-300">
                Recent Work Log
            </div>
            <div className="p-4 space-y-4">
                <div className="flex justify-between items-center animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center">
                            <Sprout className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-800 dark:text-white">Paddy Harvesting</p>
                            <p className="text-xs text-slate-500">K. Srinivas Farm • 15 Workers</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-sm text-slate-800 dark:text-white">₹7,500</p>
                        <p className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full mt-1 border border-amber-200 dark:border-amber-800">PENDING</p>
                    </div>
                </div>
                <div className="flex justify-between items-center animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-800 dark:text-white">Cotton Sowing</p>
                            <p className="text-xs text-slate-500">M. Reddy Farm • 10 Workers</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-sm text-slate-800 dark:text-white">₹4,000</p>
                        <p className="text-[10px] font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full mt-1 border border-green-200 dark:border-green-800">PAID</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const CropsMock = () => (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 h-full w-full p-6 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-2xl relative overflow-hidden min-h-[400px]">
        
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all group animate-in fade-in zoom-in duration-500 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
            <div>
                <div className="relative z-10 flex justify-between items-start mb-4">
                    <div className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 uppercase tracking-wide border border-emerald-200 dark:border-emerald-800">Active</div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">
                        <Calendar className="w-3 h-3" /> Jun 2025
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center border border-green-100 dark:border-green-900/50">
                        <Sprout className="w-6 h-6 text-green-600 dark:text-green-500" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-lg text-slate-800 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">BendaKaya</h3>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">7 Acres</p>
                    </div>
                </div>
            </div>
            <div className="relative z-10 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center mt-4">
                <div>
                    <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Total Expenses</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center">₹12,400</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:bg-green-50 dark:group-hover:bg-green-900/50 transition-colors border border-slate-100 dark:border-slate-700">
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-green-600 dark:group-hover:text-green-400" />
                </div>
            </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all group animate-in fade-in zoom-in duration-500 delay-150 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
            <div>
                <div className="relative z-10 flex justify-between items-start mb-4">
                    <div className="px-2 py-1 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 uppercase tracking-wide border border-blue-200 dark:border-blue-800">Sold</div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">
                        <Calendar className="w-3 h-3" /> Feb 2025
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                        <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-lg text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Tomato</h3>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">4 Acres</p>
                    </div>
                </div>
            </div>
            <div className="relative z-10 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center mt-4">
                <div>
                    <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">Total Revenue</p>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center">₹1,45,000</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/50 transition-colors border border-slate-100 dark:border-slate-700">
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                </div>
            </div>
        </div>
    </div>
);


const Landing = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeDemo, setActiveDemo] = useState('gramsathi');

    const scrollToDemo = () => {
        document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">

            {/* --- NAVBAR --- */}
            <nav className="flex justify-between items-center px-6 py-5 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="bg-green-600 p-2 rounded-lg">
                        <Leaf className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">AgriSpine</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 md:gap-2">
                        <ThemeToggle />
                        <LanguageSwitcher />
                    </div>

                    <button
                        onClick={() => navigate("/login")}
                        className="text-gray-600 dark:text-gray-300 font-semibold hover:text-green-600 dark:hover:text-green-400 transition px-3 py-2 md:px-4"
                    >
                        {t('auth.login_title', { defaultValue: 'Login' })}
                    </button>
                    <button
                        onClick={() => navigate("/register")}
                        className="bg-green-600 text-white px-5 py-2.5 rounded-full font-bold hover:bg-green-700 transition shadow-lg hover:shadow-green-200"
                    >
                        {t('landing.join', { defaultValue: 'Join Now' })}
                    </button>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <header className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative">
                {/* Background Blobs */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-green-400/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
                <div className="absolute bottom-10 right-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -z-10 animate-pulse delay-1000"></div>

                <div className="space-y-6">
                    <div className="inline-block bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide mb-2 shadow-sm border border-green-200 dark:border-green-800">
                        🚀 {t('landing.badge', { defaultValue: 'The Future of Farming is Here' })}
                    </div>
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-[1.1] tracking-tight">
                        {t('landing.hero_title_1', { defaultValue: 'Smart Tech for' })} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-700 dark:from-green-400 dark:to-emerald-600">{t('landing.hero_title_2', { defaultValue: 'Modern Farmers' })}</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed font-medium">
                        {t('landing.hero_desc', { defaultValue: 'Manage your crops, track expenses, rent machinery, and get expert AI advice. Your complete agricultural ecosystem.' })}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <button
                            onClick={scrollToDemo}
                            className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-xl hover:shadow-green-500/30 flex items-center justify-center gap-2 group"
                        >
                            Explore Features 
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => navigate("/register")}
                            className="bg-white dark:bg-slate-900 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition shadow-sm flex items-center justify-center"
                        >
                            {t('landing.get_started', { defaultValue: 'Get Started' })}
                        </button>
                    </div>
                    <div className="pt-8 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 font-medium border-t border-gray-100 dark:border-slate-800">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-950 flex items-center justify-center overflow-hidden shadow-sm">
                                    <UserAvatar id={i} />
                                </div>
                            ))}
                        </div>
                        <p>{t('landing.trusted', { defaultValue: 'Trusted by 10,000+ Farmers' })}</p>
                    </div>
                </div>

                {/* Hero Illustration / Graphics */}
                <div className="relative flex justify-center items-center">
                    <div className="absolute inset-0 bg-gradient-to-tr from-green-100 to-transparent dark:from-green-900/30 dark:to-transparent rounded-[3rem] transform rotate-3 scale-105 -z-10"></div>
                    <img
                        src="https://images.unsplash.com/photo-1592982537447-6f23342080c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                        alt="Modern Farming"
                        className="rounded-[3rem] shadow-2xl border-8 border-white dark:border-slate-900 transform hover:scale-[1.02] transition duration-500 object-cover h-[500px] w-full"
                    />
                    
                    {/* Floating Elements */}
                    <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 flex items-center gap-4 animate-bounce z-10 hover:scale-105 transition-transform">
                        <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full text-green-600 dark:text-green-400">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Market Prices</p>
                            <p className="text-gray-800 dark:text-white font-extrabold">+15% Yield Profit</p>
                        </div>
                    </div>
                    
                    <div className="absolute -top-6 -right-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 flex items-center gap-3 animate-pulse z-10">
                        <div className="bg-blue-100 dark:bg-blue-900/50 p-2.5 rounded-full text-blue-600 dark:text-blue-400">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <p className="text-gray-800 dark:text-white font-bold text-sm pr-2">Secure & Verified</p>
                    </div>
                </div>
            </header>

            {/* --- INTERACTIVE DEMO SHOWCASE (NEW) --- */}
            <section id="demo-section" className="py-24 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">Experience the Platform</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">See how AgriSpine simplifies your daily agricultural operations with powerful, easy-to-use tools.</p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-12 items-center">
                        {/* Interactive Menu */}
                        <div className="w-full lg:w-1/3 space-y-4">
                            <DemoTab 
                                id="gramsathi"
                                active={activeDemo}
                                onClick={setActiveDemo}
                                icon={<MessageSquare className="w-6 h-6" />}
                                title="GramSathi AI"
                                desc="Your 24/7 intelligent farming assistant. Get crop advice, disease diagnosis, and voice support."
                            />
                            <DemoTab 
                                id="groups"
                                active={activeDemo}
                                onClick={setActiveDemo}
                                icon={<Users className="w-6 h-6" />}
                                title="Labor Management"
                                desc="Easily track daily workers, manage group settlements, and record payments transparently."
                            />
                            <DemoTab 
                                id="crops"
                                active={activeDemo}
                                onClick={setActiveDemo}
                                icon={<Sprout className="w-6 h-6" />}
                                title="Crop Tracking"
                                desc="Monitor your fields, log expenses, and project revenues with beautiful financial overviews."
                            />
                        </div>

                        {/* Showcase Window */}
                        <div className="w-full lg:w-2/3">
                            <div className="relative w-full aspect-square md:aspect-[4/3] rounded-[2rem] bg-gradient-to-br from-green-100 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 md:p-8 flex items-center justify-center shadow-inner border border-slate-200 dark:border-slate-800/50">
                                {activeDemo === 'gramsathi' && <GramSathiMock />}
                                {activeDemo === 'groups' && <WorkGroupsMock />}
                                {activeDemo === 'crops' && <CropsMock />}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FEATURES SECTION --- */}
            <section className="bg-white dark:bg-slate-950 py-24 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t('landing.features_title', { defaultValue: 'Everything you need to grow' })}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-4 text-lg max-w-2xl mx-auto">{t('landing.features_subtitle', { defaultValue: 'Advanced tools simplified for every farmer. From seed to sale, we cover it all.' })}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Sprout className="w-8 h-8 text-green-600" />}
                            bg="bg-green-100 dark:bg-green-900/30"
                            title={t('dashboard.my_crops', { defaultValue: 'Crop Management' })}
                            desc={t('landing.feat_crop_desc', { defaultValue: 'Track sowing dates, expenses, and harvest yields efficiently in one dashboard.' })}
                        />
                        <FeatureCard
                            icon={<TrendingUp className="w-8 h-8 text-blue-600" />}
                            bg="bg-blue-100 dark:bg-blue-900/30"
                            title={t('dashboard.mandi_rates', { defaultValue: 'Live Market Rates' })}
                            desc={t('landing.feat_mandi_desc', { defaultValue: 'Get real-time Mandi prices across the country and sell at the highest profit.' })}
                        />
                        <FeatureCard
                            icon={<Tractor className="w-8 h-8 text-orange-600" />}
                            bg="bg-orange-100 dark:bg-orange-900/30"
                            title={t('rent.title', { defaultValue: 'Rent Machinery' })}
                            desc={t('landing.feat_rent_desc', { defaultValue: 'Find and rent tractors, drones, and harvesters from verified owners nearby.' })}
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="w-8 h-8 text-teal-600" />}
                            bg="bg-teal-100 dark:bg-teal-900/30"
                            title={t('dashboard.plant_doctor', { defaultValue: 'Plant Doctor AI' })}
                            desc={t('landing.feat_doctor_desc', { defaultValue: 'Scan leaves with your camera to detect diseases early using our AI model.' })}
                        />
                        <FeatureCard
                            icon={<Users className="w-8 h-8 text-purple-600" />}
                            bg="bg-purple-100 dark:bg-purple-900/30"
                            title={t('community.title', { defaultValue: 'Farmer Community' })}
                            desc={t('landing.feat_community_desc', { defaultValue: 'Connect with agricultural experts and fellow farmers to solve doubts instantly.' })}
                        />
                        <FeatureCard
                            icon={<Leaf className="w-8 h-8 text-yellow-600" />}
                            bg="bg-yellow-100 dark:bg-yellow-900/30"
                            title={t('dashboard.govt_schemes', { defaultValue: 'Govt Schemes' })}
                            desc={t('landing.feat_schemes_desc', { defaultValue: 'Stay updated with the latest subsidies, financial aid, and policy changes.' })}
                        />
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-slate-900 dark:bg-slate-950 border-t border-slate-800 text-slate-400 py-12 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-white">
                        <Leaf className="w-6 h-6 text-green-500" />
                        <span className="text-xl font-bold tracking-tight">AgriSpine</span>
                    </div>
                    <p className="text-sm">© 2026 AgriSpine Inc. {t('landing.rights', { defaultValue: 'All rights reserved.' })}</p>
                </div>
            </footer>

        </div>
    );
};

// Helper Component for Demo Tabs
const DemoTab = ({ id, active, onClick, icon, title, desc }) => {
    const isActive = active === id;
    return (
        <div 
            onClick={() => onClick(id)}
            className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${isActive ? 'bg-white dark:bg-slate-800 border-green-500 shadow-xl shadow-green-500/10' : 'bg-transparent border-transparent hover:bg-white/50 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700'}`}
        >
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${isActive ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {icon}
                </div>
                <div>
                    <h3 className={`text-lg font-bold ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{title}</h3>
                    <p className={`mt-1 text-sm ${isActive ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500'}`}>{desc}</p>
                </div>
            </div>
        </div>
    )
}

// Helper Component for Cards
const FeatureCard = ({ icon, bg, title, desc }) => (
    <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:shadow-green-500/5 hover:-translate-y-2 transition-all duration-500 group">
        <div className={`${bg} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
            {icon}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">{desc}</p>
    </div>
);

// Helper for Dummy Avatars
const UserAvatar = ({ id }) => (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-slate-400">
        <path d="M18 18C21.3137 18 24 15.3137 24 12C24 8.68629 21.3137 6 18 6C14.6863 6 12 8.68629 12 12C12 15.3137 14.6863 18 18 18Z" fill="currentColor"/>
        <path d="M18 21C11.3726 21 6 26.3726 6 33H30C30 26.3726 24.6274 21 18 21Z" fill="currentColor" opacity="0.5"/>
    </svg>
)

export default Landing;
