import React from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, TrendingUp, Tractor, Users, ArrowRight, ShieldCheck, Leaf, MessageSquare, Briefcase, Calendar, MapPin, IndianRupee, Bot, ChevronRight, CloudRain, Sun, CloudSun, ShoppingBag, Truck, CheckCircle2, BarChart3, LineChart, Stethoscope, Activity, Scale, Landmark, ScrollText } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import ThemeToggle from "../../components/ThemeToggle";

// ==========================================
// REUSABLE MOCKUPS FOR FEATURES
// ==========================================

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
        <div className="flex-1 p-6 space-y-6 overflow-hidden relative">
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
                        <span className="font-bold text-amber-800 dark:text-amber-400">Recommendation:</span> Use Neem oil (5ml/L) or Imidacloprid (0.5ml/L).
                    </div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg text-xs font-bold text-green-700 dark:text-green-400 hover:bg-green-200 transition-colors">Buy Pesticide</button>
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
    <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 h-full w-full p-6 flex flex-col gap-4 shadow-2xl relative overflow-hidden min-h-[400px]">
        <div className="flex justify-between items-center mb-2">
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Daily Labor Group</h3>
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
                <p className="text-xs text-slate-500 font-bold uppercase">Net Settlement</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-500 mt-1">₹45,500</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 font-bold uppercase">Pending</p>
                <p className="text-2xl font-bold text-amber-500 mt-1">₹12,000</p>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex-1 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-bold text-sm text-slate-700 dark:text-slate-300">Recent Work</div>
            <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center">
                            <Sprout className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-800 dark:text-white">Paddy Harvesting</p>
                            <p className="text-xs text-slate-500">15 Workers</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-sm text-slate-800 dark:text-white">₹7,500</p>
                        <p className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full mt-1 inline-block">PENDING</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const CropsMock = () => (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 h-full w-full p-6 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-2xl relative overflow-hidden min-h-[400px]">
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
            <div>
                <div className="relative z-10 flex justify-between items-start mb-4">
                    <div className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 uppercase border border-emerald-200 dark:border-emerald-800">Active</div>
                </div>
                <div className="relative z-10 flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center border border-green-100 dark:border-green-900/50">
                        <Sprout className="w-6 h-6 text-green-600 dark:text-green-500" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">Tomato</h3>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">5 Acres</p>
                    </div>
                </div>
            </div>
            <div className="relative z-10 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center mt-4">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Expenses</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">₹12,400</p>
                </div>
            </div>
        </div>
        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
            <div>
                <div className="relative z-10 flex justify-between items-start mb-4">
                    <div className="px-2 py-1 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 uppercase border border-blue-200 dark:border-blue-800">Harvested</div>
                </div>
                <div className="relative z-10 flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                        <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">Cotton</h3>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">10 Acres</p>
                    </div>
                </div>
            </div>
            <div className="relative z-10 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center mt-4">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Revenue</p>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">₹1,45,000</p>
                </div>
            </div>
        </div>
    </div>
);

const WeatherMock = () => (
    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl h-full w-full p-6 text-white shadow-2xl relative overflow-hidden min-h-[400px] flex flex-col">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="flex justify-between items-center z-10">
            <div>
                <h3 className="font-bold text-lg opacity-90">Hyderabad</h3>
                <p className="text-xs opacity-75">Today, 10:30 AM</p>
            </div>
            <CloudRain className="w-10 h-10 opacity-90" />
        </div>
        <div className="mt-8 mb-auto z-10">
            <h1 className="text-7xl font-bold tracking-tighter">28°</h1>
            <p className="text-xl font-medium mt-2 opacity-90">Moderate Rain</p>
            <p className="text-sm opacity-75 mt-1">Perfect time for indoor planning. Avoid spraying pesticides.</p>
        </div>
        <div className="grid grid-cols-4 gap-2 z-10 mt-6 bg-white/10 p-3 rounded-2xl backdrop-blur-md">
            {[1,2,3,4].map(i => (
                <div key={i} className="text-center">
                    <p className="text-[10px] opacity-75 uppercase">{i+1} PM</p>
                    <CloudRain className="w-5 h-5 mx-auto my-1 opacity-90" />
                    <p className="text-xs font-bold">{28 - i}°</p>
                </div>
            ))}
        </div>
    </div>
);

const MarketMock = () => (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 h-full w-full p-6 flex flex-col shadow-2xl relative overflow-hidden min-h-[400px]">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Fertilizers & Seeds</h3>
        <div className="space-y-4">
            {[1, 2].map(i => (
                <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex gap-4">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">Urea 46% Nitrogen</h4>
                        <p className="text-xs text-slate-500 mt-1">IFFCO • 45kg Bag</p>
                        <div className="flex justify-between items-center mt-2">
                            <span className="font-bold text-green-600">₹266.50</span>
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded">In Stock</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const MachineryMock = () => (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 h-full w-full p-6 flex flex-col shadow-2xl relative overflow-hidden min-h-[400px]">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Tractors Near You</h3>
        <div className="grid grid-cols-2 gap-4 h-full">
            {[1, 2].map(i => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden">
                    <div className="h-24 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <Tractor className="w-10 h-10 text-slate-400" />
                    </div>
                    <div className="p-3">
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">Mahindra 575 DI</h4>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> 2.5 km away</p>
                        <button className="w-full mt-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors">Rent Now</button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// ==========================================
// LANDING PAGE COMPONENT
// ==========================================

const FeatureSection = ({ id, reverse, title, subtitle, icon: Icon, features, MockupComponent, bgColor = "bg-white dark:bg-slate-950" }) => (
    <section id={id} className={`py-24 ${bgColor}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className={`flex flex-col lg:flex-row items-center gap-16 ${reverse ? 'lg:flex-row-reverse' : ''}`}>
                <div className="flex-1 space-y-6">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-6">
                        <Icon className="w-6 h-6" />
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {title}
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                        {subtitle}
                    </p>
                    <ul className="space-y-4 pt-4">
                        {features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex-1 w-full lg:w-auto relative">
                    <div className="absolute inset-0 bg-green-500/5 dark:bg-green-500/10 blur-3xl rounded-full transform scale-95 translate-y-10 -z-10"></div>
                    <MockupComponent />
                </div>
            </div>
        </div>
    </section>
);

const Landing = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans selection:bg-green-200 selection:text-green-900">
            {/* Minimal Header */}
            <header className="fixed top-0 inset-x-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                            <Leaf className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            Agri<span className="text-green-600">Spine</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <LanguageSwitcher />
                        <button onClick={() => navigate('/login')} className="hidden sm:block text-slate-600 dark:text-slate-300 font-bold hover:text-green-600 dark:hover:text-green-400 transition-colors">
                            {t('landing.login')}
                        </button>
                        <button onClick={() => navigate('/register')} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full font-bold hover:bg-green-600 dark:hover:bg-green-500 hover:text-white transition-all shadow-md">
                            {t('landing.register')}
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 pt-20">
                {/* 0. Hero Section */}
                <section className="relative overflow-hidden bg-white dark:bg-slate-950 pt-20 pb-32 lg:pt-32 lg:pb-40 border-b border-slate-100 dark:border-slate-900">
                    <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-green-50 dark:from-green-950/20 to-transparent"></div>
                    <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                        <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8">
                            The Complete <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">Agri-SaaS</span> Platform
                        </h1>
                        <p className="text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
                            Manage crops, automate labor settlements, track market prices, and instantly identify plant diseases using AI—all in one premium dashboard.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button onClick={() => navigate('/register')} className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-green-600/30 flex items-center justify-center gap-2">
                                Start Free Trial <ArrowRight className="w-5 h-5" />
                            </button>
                            <button onClick={() => {
                                document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
                            }} className="px-8 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2">
                                Explore Features
                            </button>
                        </div>
                    </div>
                </section>

                <div id="features">
                    {/* 1. My Crops */}
                    <FeatureSection 
                        id="crops"
                        title="Crop Lifecycle Management"
                        subtitle="Track everything from sowing to harvesting. Monitor acreage, record expenses, and project your revenue effortlessly in a beautiful grid dashboard."
                        icon={Sprout}
                        features={["Full expense tracking", "Status badges (Active, Harvested, Sold)", "Automated yield calculations", "Rich data visualization"]}
                        MockupComponent={CropsMock}
                        bgColor="bg-slate-50 dark:bg-slate-900/20"
                    />

                    {/* 2. GramSathi AI */}
                    <FeatureSection 
                        id="gramsathi"
                        reverse={true}
                        title="GramSathi AI Assistant"
                        subtitle="Your intelligent farming companion. Ask questions about diseases, soil health, or market trends in your local language and get actionable advice."
                        icon={Bot}
                        features={["24/7 agricultural intelligence", "Multilingual support", "Instant pesticide recommendations", "Direct integration with marketplace"]}
                        MockupComponent={GramSathiMock}
                        bgColor="bg-white dark:bg-slate-950"
                    />

                    {/* 3. Weather Intelligence */}
                    <FeatureSection 
                        id="weather"
                        title="Weather Intelligence"
                        subtitle="Make critical decisions like when to sow or spray based on highly accurate, real-time micro-climate data for your exact farm location."
                        icon={CloudSun}
                        features={["Hyper-local precipitation alerts", "Hourly temperature tracking", "Spraying suitability indicator", "Severe weather warnings"]}
                        MockupComponent={WeatherMock}
                        bgColor="bg-slate-50 dark:bg-slate-900/20"
                    />

                    {/* 4. Work Groups */}
                    <FeatureSection 
                        id="workgroups"
                        reverse={true}
                        title="Automated Labor Settlements"
                        subtitle="Ditch the notebook. Track daily attendance for labor groups and let the system automatically calculate net payables, receivables, and internal farm deductions."
                        icon={Users}
                        features={["Automatic net settlement math", "Line-by-line payout breakdown", "Internal member farm support", "Partial payment tracking"]}
                        MockupComponent={WorkGroupsMock}
                        bgColor="bg-white dark:bg-slate-950"
                    />

                    {/* 5. Marketplace */}
                    <FeatureSection 
                        id="marketplace"
                        title="Direct Marketplace"
                        subtitle="Buy seeds, fertilizers, and pesticides directly from verified sellers. Cut out the middlemen and ensure you're getting genuine products at the best prices."
                        icon={ShoppingBag}
                        features={["Verified input sellers", "Live inventory tracking", "Direct-to-farm delivery", "Bulk purchase discounts"]}
                        MockupComponent={MarketMock}
                        bgColor="bg-slate-50 dark:bg-slate-900/20"
                    />

                    {/* 6. Rent Machinery */}
                    <FeatureSection 
                        id="machinery"
                        reverse={true}
                        title="Machinery Rentals"
                        subtitle="Don't own a tractor or a drone? Find available machinery for rent from verified farmers nearby and book it instantly."
                        icon={Tractor}
                        features={["GPS-based proximity matching", "Hourly & daily rates", "Drone spraying services", "Verified owner reviews"]}
                        MockupComponent={MachineryMock}
                        bgColor="bg-white dark:bg-slate-950"
                    />
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="bg-slate-900 dark:bg-black py-12 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Leaf className="w-6 h-6 text-green-500" />
                        <span className="text-xl font-black tracking-tight text-white">
                            Agri<span className="text-green-500">Spine</span>
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">
                        © 2026 AgriSpine. Empowering modern agriculture.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
