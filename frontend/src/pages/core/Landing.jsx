import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, TrendingUp, Tractor, Users, ArrowRight, ShieldCheck, Leaf, MessageSquare, Briefcase, Calendar, MapPin, IndianRupee, Bot, ChevronRight, CloudRain, Sun, CloudSun, ShoppingBag, Truck, CheckCircle2, BarChart3, LineChart, Stethoscope, Activity, Scale, Landmark, ScrollText, Check } from "lucide-react";
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
            <div className="flex justify-end">
                <div className="bg-green-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 max-w-[80%] shadow-md">
                    <p className="text-sm">What should I spray for leaf curl disease on my tomatoes?</p>
                </div>
            </div>
            <div className="flex gap-3">
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
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden flex flex-col justify-between group">
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
                        <h3 className="font-extrabold text-lg text-slate-800 dark:text-white group-hover:text-green-600 transition-colors">Tomato</h3>
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
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden flex flex-col justify-between group">
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
                        <h3 className="font-extrabold text-lg text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">Cotton</h3>
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

const MessengerMock = () => {
    const messages = [
        { sender: "Panchayat Office", text: "Ration distribution has started today.", time: "09:00 AM" },
        { sender: "Agri Dept", text: "Free seed distribution tomorrow.", time: "10:30 AM" },
        { sender: "Sarpanch", text: "Village meeting at 5 PM regarding water supply.", time: "11:45 AM" },
        { sender: "Weather Alert", text: "Heavy rainfall expected tonight. Please secure harvested crops.", time: "02:15 PM" },
        { sender: "Work Group", text: "Work Group Vari Natu starts at 7 AM tomorrow.", time: "04:30 PM" }
    ];

    return (
        <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 h-full w-full flex flex-col shadow-2xl relative overflow-hidden min-h-[400px]">
            <div className="bg-white dark:bg-slate-950 p-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-500" /> Village Broadcasts
                </h3>
            </div>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar bg-slate-100/50 dark:bg-slate-900/50">
                {messages.map((msg, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{msg.sender}</span>
                            <span className="text-[10px] text-slate-400">{msg.time}</span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-200">{msg.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CommunityMock = () => (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 h-full w-full p-6 flex flex-col shadow-2xl relative overflow-hidden min-h-[400px]">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" /> Farmers Forum
        </h3>
        <div className="space-y-4 flex-1 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-xs">V</div>
                    <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Venkat Rao</p>
                        <p className="text-[10px] text-slate-500">2 hours ago</p>
                    </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">Has anyone tried the new organic fertilizer from the local mandi? Seeing good results on my paddy.</p>
                <div className="flex gap-4 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1"><Check className="w-4 h-4"/> 12 Likes</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4"/> 4 Replies</span>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-600 text-xs">M</div>
                    <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Mahesh N.</p>
                        <p className="text-[10px] text-slate-500">5 hours ago</p>
                    </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">Selling my used drip irrigation pipes. Good condition, enough for 2 acres. DM for price.</p>
                <div className="flex gap-4 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1"><Check className="w-4 h-4"/> 5 Likes</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4"/> 2 Replies</span>
                </div>
            </div>
        </div>
    </div>
);

const GovtSchemesMock = () => (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 h-full w-full p-6 flex flex-col shadow-2xl relative overflow-hidden min-h-[400px]">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-amber-500" /> Active Govt Schemes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">PM-KISAN</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">Financial benefit of ₹6,000 per year payable in three equal installments.</p>
                </div>
                <button className="mt-3 text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg w-fit">Apply Now</button>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">Rythu Bandhu</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">Investment support for agriculture and horticulture crops in Telangana.</p>
                </div>
                <button className="mt-3 text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg w-fit">Check Status</button>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between sm:col-span-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">PM Fasal Bima Yojana</h4>
                        <p className="text-xs text-slate-500 mt-1">Crop insurance scheme for protection against natural calamities.</p>
                    </div>
                    <ShieldCheck className="w-8 h-8 text-blue-500 opacity-20" />
                </div>
                <button className="mt-3 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">View Details</button>
            </div>
        </div>
    </div>
);

const AnalyticsMock = () => (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 h-full w-full p-6 flex flex-col shadow-2xl relative overflow-hidden min-h-[400px]">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" /> Farm Analytics
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Total Revenue (YTD)</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">₹3,45,000</p>
                <p className="text-xs text-green-500 font-bold mt-1">↑ 12% vs Last Year</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Total Expenses</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">₹1,12,000</p>
                <p className="text-xs text-slate-400 font-bold mt-1">Fertilizer & Labor</p>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex-1 flex flex-col">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-4">Profit Margin Trend</p>
            <div className="flex-1 flex items-end justify-between gap-2 px-2">
                {/* Mock Chart Bars */}
                {[40, 60, 30, 80, 50, 90, 70].map((height, i) => (
                    <div key={i} className="w-full bg-purple-100 dark:bg-purple-900/30 rounded-t-md relative group">
                        <div 
                            className="absolute bottom-0 w-full bg-purple-500 rounded-t-md transition-all duration-1000" 
                            style={{ height: `${height}%` }}
                        ></div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-slate-400 px-2">
                <span>Jan</span>
                <span>Jul</span>
            </div>
        </div>
    </div>
);

// ==========================================
// LANDING PAGE COMPONENT
// ==========================================

const FeatureSection = ({ id, reverse, title, subtitle, icon: Icon, features, MockupComponent, bgColor = "bg-white dark:bg-slate-950" }) => (
    <section id={id} className={`py-24 ${bgColor} scroll-mt-32`}>
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
                                <span className="text-slate-700 dark:text-slate-300 font-medium">{feature}</span>
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
    const [activeSection, setActiveSection] = useState("");

    // Setup scroll spy for navigation
    useEffect(() => {
        const handleScroll = () => {
            const sections = [
                'crops', 'gramsathi', 'weather', 'workgroups', 'marketplace', 
                'machinery', 'messenger', 'community', 'schemes', 'analytics'
            ];
            
            let current = "";
            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= 200 && rect.bottom >= 200) {
                        current = section;
                        break;
                    }
                }
            }
            setActiveSection(current);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans selection:bg-green-200 selection:text-green-900">
            {/* Minimal Header */}
            <header className="fixed top-0 inset-x-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 z-50">
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
                            {t('landing.login', 'Login')}
                        </button>
                        {/* 1. FIX NAVBAR REGISTER BUTTON */}
                        <button onClick={() => navigate('/register')} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full font-bold hover:bg-green-600 dark:hover:bg-green-500 hover:text-white transition-all shadow-md">
                            {t('landing.register', 'Register')}
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 pt-20">
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-white dark:bg-slate-950 pt-24 pb-32 lg:pt-40 lg:pb-48 border-b border-slate-100 dark:border-slate-900">
                    <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-green-50 dark:from-green-950/20 to-transparent"></div>
                    <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                        {/* 3. HERO SECTION TITLE */}
                        <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8">
                            AgriSpine — Your Complete <br className="hidden lg:block"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">Digital Farming</span> Companion
                        </h1>
                        <p className="text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-16 leading-relaxed font-medium">
                            Manage crops, automate labor settlements, track market prices, and stay connected with your village—all in one premium platform.
                        </p>
                        
                        {/* 11. AUTHENTICATION UI (Hero Buttons) */}
                        <div className="flex flex-col sm:flex-row justify-center gap-6">
                            {/* 2. REMOVE START FREE TRIAL */}
                            <button onClick={() => navigate('/register')} className="px-10 py-5 bg-green-600 hover:bg-green-700 text-white rounded-[2rem] font-black text-xl transition-all shadow-xl shadow-green-600/30 flex items-center justify-center gap-3 hover:scale-105 active:scale-95">
                                Join AgriSpine <ArrowRight className="w-6 h-6" />
                            </button>
                            <button onClick={() => scrollTo('crops')} className="px-10 py-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-[2rem] font-black text-xl transition-all flex items-center justify-center gap-3 hover:scale-105 active:scale-95">
                                Explore Features
                            </button>
                        </div>
                    </div>
                </section>

                {/* 9. FEATURE NAVIGATION (Sticky Bar) */}
                <div className="sticky top-20 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-x-auto custom-scrollbar">
                    <div className="max-w-7xl mx-auto px-6 flex items-center gap-6 py-4 min-w-max">
                        {[
                            { id: 'crops', label: 'My Crops' },
                            { id: 'gramsathi', label: 'GramSathi AI' },
                            { id: 'weather', label: 'Weather' },
                            { id: 'workgroups', label: 'Work Groups' },
                            { id: 'marketplace', label: 'Marketplace' },
                            { id: 'machinery', label: 'Rent Machinery' },
                            { id: 'messenger', label: 'Messenger' },
                            { id: 'community', label: 'Community' },
                            { id: 'schemes', label: 'Govt Schemes' },
                            { id: 'analytics', label: 'Analytics' }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => scrollTo(item.id)}
                                className={`text-sm font-bold whitespace-nowrap transition-colors px-3 py-1.5 rounded-full ${activeSection === item.id ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div id="features-container">
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

                    {/* 3. Weather */}
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

                    {/* 7. Messenger */}
                    <FeatureSection 
                        id="messenger"
                        title="Village Messenger"
                        subtitle="Stay connected with your local community. Receive official announcements from the Panchayat, Agriculture Department, and other verified local authorities."
                        icon={MessageSquare}
                        features={["Real-time village announcements", "Government alert broadcasts", "Work group notifications", "Secure and verified senders"]}
                        MockupComponent={MessengerMock}
                        bgColor="bg-slate-50 dark:bg-slate-900/20"
                    />

                    {/* 8. Community */}
                    <FeatureSection 
                        id="community"
                        reverse={true}
                        title="Farmers Forum"
                        subtitle="Join the conversation. Share experiences, ask for advice, or post listings for used equipment in a vibrant community of fellow farmers."
                        icon={Users}
                        features={["Peer-to-peer knowledge sharing", "Equipment classifieds", "Upvote and reply system", "Regional networking"]}
                        MockupComponent={CommunityMock}
                        bgColor="bg-white dark:bg-slate-950"
                    />

                    {/* 9. Government Schemes */}
                    <FeatureSection 
                        id="schemes"
                        title="Government Schemes"
                        subtitle="Never miss out on financial aid or subsidies. Browse a curated list of active state and central government schemes with direct application links."
                        icon={Landmark}
                        features={["PM-KISAN tracking", "Crop insurance details", "State-specific subsidies", "Direct eligibility checks"]}
                        MockupComponent={GovtSchemesMock}
                        bgColor="bg-slate-50 dark:bg-slate-900/20"
                    />

                    {/* 10. Analytics */}
                    <FeatureSection 
                        id="analytics"
                        reverse={true}
                        title="Farm Analytics"
                        subtitle="Understand your farm's financial health. Track total revenues, expenses, and profit margins over time with beautiful, easy-to-read charts."
                        icon={BarChart3}
                        features={["Revenue vs Expense tracking", "Profit margin trends", "Year-over-year comparisons", "Exportable reports"]}
                        MockupComponent={AnalyticsMock}
                        bgColor="bg-white dark:bg-slate-950"
                    />
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="bg-slate-900 dark:bg-black py-16 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Leaf className="w-8 h-8 text-green-500" />
                        <span className="text-2xl font-black tracking-tight text-white">
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
