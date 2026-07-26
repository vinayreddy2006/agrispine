import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, TrendingUp, Tractor, Users, ArrowRight, ShieldCheck, Leaf, MessageSquare, Briefcase, Calendar, MapPin, IndianRupee, Bot, ChevronRight, CloudRain, Sun, CloudSun, ShoppingBag, Truck, CheckCircle2, BarChart3, LineChart, Stethoscope, Activity, Scale, Landmark, ScrollText, Check, MessageSquarePlus, Filter, Search, MoreVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import ThemeToggle from "../../components/ThemeToggle";

// ==========================================
// REUSABLE MOCKUPS FOR FEATURES
// ==========================================

const GramSathiMock = () => {
    const { t } = useTranslation();
    return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 h-full w-full flex flex-col overflow-hidden shadow-2xl relative min-h-[400px]">
        <div className="bg-white dark:bg-slate-950 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
                <h3 className="font-bold text-slate-800 dark:text-white">{t('landing.mock_ai_title', { defaultValue: 'GramSathi AI' })}</h3>
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">{t('landing.mock_ai_status', { defaultValue: 'Online • Farm Assistant' })}</p>
            </div>
        </div>
        <div className="flex-1 p-6 space-y-6 overflow-hidden relative">
            <div className="flex justify-end">
                <div className="bg-green-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 max-w-[80%] shadow-md">
                    <p className="text-sm">{t('landing.mock_ai_q', { defaultValue: 'What should I spray for leaf curl disease on my tomatoes?' })}</p>
                </div>
            </div>
            <div className="flex gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-sm px-5 py-4 max-w-[85%] shadow-sm">
                    <p className="text-sm leading-relaxed mb-3">
                        {t('landing.mock_ai_a1', { defaultValue: 'Leaf curl in tomatoes is typically caused by the Tomato Yellow Leaf Curl Virus (TYLCV), spread by whiteflies.' })}
                    </p>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3 text-xs mb-3">
                        <span className="font-bold text-amber-800 dark:text-amber-400">{t('landing.mock_ai_a2', { defaultValue: 'Recommendation:' })}</span> {t('landing.mock_ai_a3', { defaultValue: 'Use Neem oil (5ml/L) or Imidacloprid (0.5ml/L).' })}
                    </div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg text-xs font-bold text-green-700 dark:text-green-400 hover:bg-green-200 transition-colors">{t('landing.mock_ai_btn', { defaultValue: 'Buy Pesticide' })}</button>
                    </div>
                </div>
            </div>
        </div>
        <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-full h-10 px-4 flex items-center">
                <span className="text-sm text-slate-400">{t('landing.mock_ai_placeholder', { defaultValue: 'Ask in any language...' })}</span>
            </div>
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-green-700 transition-colors">
                <ArrowRight className="w-5 h-5" />
            </div>
        </div>
    </div>
)};

const WorkGroupsMock = () => {
    const { t } = useTranslation();
    return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 h-full w-full p-6 flex flex-col gap-4 shadow-2xl relative overflow-hidden min-h-[400px]">
        <div className="flex justify-between items-center mb-2">
            <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('landing.mock_wg_title', { defaultValue: 'Daily Labor Group' })}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3"/> {t('landing.mock_wg_loc', { defaultValue: 'Kodad, Telangana' })}</p>
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
                <p className="text-xs text-slate-500 font-bold uppercase">{t('landing.mock_wg_net', { defaultValue: 'Net Settlement' })}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-500 mt-1">₹45,500</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 font-bold uppercase">{t('landing.mock_wg_pending', { defaultValue: 'Pending' })}</p>
                <p className="text-2xl font-bold text-amber-500 mt-1">₹12,000</p>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex-1 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-bold text-sm text-slate-700 dark:text-slate-300">{t('landing.mock_wg_recent', { defaultValue: 'Recent Work' })}</div>
            <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center">
                            <Sprout className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-800 dark:text-white">{t('landing.mock_wg_task', { defaultValue: 'Paddy Harvesting' })}</p>
                            <p className="text-xs text-slate-500">{t('landing.mock_wg_workers', { defaultValue: '15 Workers' })}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-sm text-slate-800 dark:text-white">₹7,500</p>
                        <p className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full mt-1 inline-block">{t('landing.mock_wg_status', { defaultValue: 'PENDING' })}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
)};

const CropsMock = () => {
    const { t } = useTranslation();
    return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 h-full w-full p-6 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-2xl relative overflow-hidden min-h-[400px]">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
            <div>
                <div className="relative z-10 flex justify-between items-start mb-4">
                    <div className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 uppercase border border-emerald-200 dark:border-emerald-800">{t('landing.mock_crop_active', { defaultValue: 'Active' })}</div>
                </div>
                <div className="relative z-10 flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center border border-green-100 dark:border-green-900/50">
                        <Sprout className="w-6 h-6 text-green-600 dark:text-green-500" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-lg text-slate-800 dark:text-white group-hover:text-green-600 transition-colors">{t('landing.mock_crop_1', { defaultValue: 'Tomato' })}</h3>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{t('landing.mock_crop_1_area', { defaultValue: '5 Acres' })}</p>
                    </div>
                </div>
            </div>
            <div className="relative z-10 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center mt-4">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t('landing.mock_crop_exp', { defaultValue: 'Total Expenses' })}</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">₹12,400</p>
                </div>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden flex flex-col justify-between group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
            <div>
                <div className="relative z-10 flex justify-between items-start mb-4">
                    <div className="px-2 py-1 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 uppercase border border-blue-200 dark:border-blue-800">{t('landing.mock_crop_harvested', { defaultValue: 'Harvested' })}</div>
                </div>
                <div className="relative z-10 flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                        <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-lg text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">{t('landing.mock_crop_2', { defaultValue: 'Cotton' })}</h3>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{t('landing.mock_crop_2_area', { defaultValue: '10 Acres' })}</p>
                    </div>
                </div>
            </div>
            <div className="relative z-10 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center mt-4">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t('landing.mock_crop_rev', { defaultValue: 'Total Revenue' })}</p>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">₹1,45,000</p>
                </div>
            </div>
        </div>
    </div>
)};

const WeatherMock = () => {
    const { t } = useTranslation();
    return (
    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl h-full w-full p-6 text-white shadow-2xl relative overflow-hidden min-h-[400px] flex flex-col">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="flex justify-between items-center z-10">
            <div>
                <h3 className="font-bold text-lg opacity-90">{t('landing.mock_weather_city', { defaultValue: 'Hyderabad' })}</h3>
                <p className="text-xs opacity-75">{t('landing.mock_weather_time', { defaultValue: 'Today, 10:30 AM' })}</p>
            </div>
            <CloudRain className="w-10 h-10 opacity-90" />
        </div>
        <div className="mt-8 mb-auto z-10">
            <h1 className="text-7xl font-bold tracking-tighter">28°</h1>
            <p className="text-xl font-medium mt-2 opacity-90">{t('landing.mock_weather_desc', { defaultValue: 'Moderate Rain' })}</p>
            <p className="text-sm opacity-75 mt-1">{t('landing.mock_weather_advise', { defaultValue: 'Perfect time for indoor planning. Avoid spraying pesticides.' })}</p>
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
)};



const MachineryMock = () => {
    const { t } = useTranslation();
    return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 h-full w-full p-6 flex flex-col shadow-2xl relative overflow-hidden min-h-[400px]">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">{t('landing.mock_machinery_title', { defaultValue: 'Tractors Near You' })}</h3>
        <div className="grid grid-cols-2 gap-4 h-full">
            {[1, 2].map(i => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden">
                    <div className="h-24 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <Tractor className="w-10 h-10 text-slate-400" />
                    </div>
                    <div className="p-3">
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{t('landing.mock_machinery_item', { defaultValue: 'Mahindra 575 DI' })}</h4>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> {t('landing.mock_machinery_dist', { defaultValue: '2.5 km away' })}</p>
                        <button className="w-full mt-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors">{t('landing.mock_machinery_btn', { defaultValue: 'Rent Now' })}</button>
                    </div>
                </div>
            ))}
        </div>
    </div>
)};

const MessengerMock = () => {
    const { t } = useTranslation();
    return (
        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 h-full w-full flex shadow-2xl relative overflow-hidden min-h-[450px]">
            {/* Sidebar Simulation */}
            <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-900">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-950">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">{t('landing.mock_msg_chats', { defaultValue: 'Chats' })}</h3>
                    <MessageSquarePlus className="w-4 h-4 text-slate-500" />
                </div>
                <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-md p-1.5 flex items-center gap-2">
                        <Search className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] text-slate-400">{t('landing.mock_msg_search', { defaultValue: 'Search...' })}</span>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Active Chat */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-slate-100 dark:border-slate-800 flex gap-2 cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0 flex items-center justify-center text-blue-600 text-xs font-bold">P</div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[11px] font-bold text-slate-800 dark:text-white truncate">{t('landing.mock_msg_p_title', { defaultValue: 'Panchayat Office' })}</h4>
                                <span className="text-[8px] text-slate-400">10:30 AM</span>
                            </div>
                            <p className="text-[9px] text-slate-500 truncate">{t('landing.mock_msg_p_msg1', { defaultValue: 'Pension Officer has arrived' })}...</p>
                        </div>
                    </div>
                    {/* Other Chats */}
                    {[
                        { title: t('landing.mock_msg_a_title', { defaultValue: 'Agri Dept' }), msg: t('landing.mock_msg_a_msg', { defaultValue: 'Free seed distribution starts tomorrow.' }), time: '09:15 AM', initial: 'A' },
                        { title: t('landing.mock_msg_s_title', { defaultValue: 'Sarpanch' }), msg: t('landing.mock_msg_s_msg', { defaultValue: 'Village meeting at 5 PM.' }), time: 'Yesterday', initial: 'S' },
                        { title: t('landing.mock_msg_w_title', { defaultValue: 'Weather Alert' }), msg: t('landing.mock_msg_w_msg', { defaultValue: 'Heavy rain expected tonight.' }), time: 'Yesterday', initial: 'W' },
                        { title: t('landing.mock_msg_wg_title', { defaultValue: 'Work Group Vari Natu' }), msg: t('landing.mock_msg_wg_msg', { defaultValue: 'Starts at 7 AM tomorrow.' }), time: 'Monday', initial: 'W' },
                    ].map((chat, idx) => (
                        <div key={idx} className="p-3 border-b border-slate-100 dark:border-slate-800 flex gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold">{chat.initial}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{chat.title}</h4>
                                    <span className="text-[8px] text-slate-400">{chat.time}</span>
                                </div>
                                <p className="text-[9px] text-slate-500 truncate">{chat.msg}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Window Simulation */}
            <div className="w-2/3 flex flex-col bg-[#e5ddd5] dark:bg-[#0b141a] relative">
                {/* Chat Background Pattern */}
                <div className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.05] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }} />
                
                {/* Header */}
                <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center z-10 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 text-xs font-bold">P</div>
                        <div>
                            <h3 className="font-bold text-xs text-slate-800 dark:text-white">{t('landing.mock_msg_p_title', { defaultValue: 'Panchayat Office' })}</h3>
                            <p className="text-[9px] text-green-500 font-medium">Online</p>
                        </div>
                    </div>
                    <MoreVertical className="w-4 h-4 text-slate-500" />
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden z-10">
                    <div className="self-center bg-blue-50/80 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[9px] px-2 py-1 rounded-md mb-2 shadow-sm">
                        {t('landing.mock_msg_date', { defaultValue: 'TODAY' })}
                    </div>
                    
                    <div className="self-start max-w-[85%]">
                        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg rounded-tl-none shadow-sm relative">
                            <p className="text-xs text-slate-800 dark:text-slate-200">{t('landing.mock_msg_p_msg1', { defaultValue: 'Pension Officer has arrived at Panchayat Office. Please bring your Aadhar cards.' })}</p>
                            <div className="text-[8px] text-slate-400 text-right mt-1">09:00 AM</div>
                        </div>
                    </div>
                    
                    <div className="self-start max-w-[85%]">
                        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg rounded-tl-none shadow-sm relative">
                            <p className="text-xs text-slate-800 dark:text-slate-200">{t('landing.mock_msg_p_msg2', { defaultValue: 'Vaccination camp will be held tomorrow near the government school.' })}</p>
                            <div className="text-[8px] text-slate-400 text-right mt-1">09:45 AM</div>
                        </div>
                    </div>

                    <div className="self-start max-w-[85%]">
                        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg rounded-tl-none shadow-sm relative">
                            <p className="text-xs text-slate-800 dark:text-slate-200">{t('landing.mock_msg_p_msg3', { defaultValue: 'Ration distribution has started.' })}</p>
                            <div className="text-[8px] text-slate-400 text-right mt-1">10:30 AM</div>
                        </div>
                    </div>

                    <div className="self-end max-w-[85%]">
                        <div className="bg-[#dcf8c6] dark:bg-[#005c4b] p-2 rounded-lg rounded-tr-none shadow-sm relative">
                            <p className="text-xs text-slate-800 dark:text-slate-200">{t('landing.mock_msg_reply', { defaultValue: 'Thank you for the update. Will come by 11 AM.' })}</p>
                            <div className="text-[8px] text-slate-500 text-right mt-1 flex justify-end gap-1 items-center">
                                10:32 AM <Check className="w-2.5 h-2.5 text-blue-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Input Bar */}
                <div className="p-3 bg-[#f0f2f5] dark:bg-slate-900 z-10 flex items-center gap-2">
                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-full h-8 px-3 flex items-center shadow-sm">
                        <span className="text-[10px] text-slate-400">{t('landing.mock_msg_type', { defaultValue: 'Type a message' })}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shadow-sm">
                        <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const CommunityMock = () => {
    const { t } = useTranslation();
    return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 h-full w-full p-6 flex flex-col shadow-2xl relative overflow-hidden min-h-[400px]">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" /> {t('landing.mock_com_title', { defaultValue: 'Farmers Forum' })}
        </h3>
        <div className="space-y-4 flex-1 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-xs">V</div>
                    <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{t('landing.mock_com_u1', { defaultValue: 'Venkat Rao' })}</p>
                        <p className="text-[10px] text-slate-500">{t('landing.mock_com_time1', { defaultValue: '2 hours ago' })}</p>
                    </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{t('landing.mock_com_msg1', { defaultValue: 'Has anyone tried the new organic fertilizer from the local mandi? Seeing good results on my paddy.' })}</p>
                <div className="flex gap-4 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1"><Check className="w-4 h-4"/> 12 {t('landing.mock_com_likes', { defaultValue: 'Likes' })}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4"/> 4 {t('landing.mock_com_replies', { defaultValue: 'Replies' })}</span>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-600 text-xs">M</div>
                    <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{t('landing.mock_com_u2', { defaultValue: 'Mahesh N.' })}</p>
                        <p className="text-[10px] text-slate-500">{t('landing.mock_com_time2', { defaultValue: '5 hours ago' })}</p>
                    </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{t('landing.mock_com_msg2', { defaultValue: 'Selling my used drip irrigation pipes. Good condition, enough for 2 acres. DM for price.' })}</p>
                <div className="flex gap-4 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1"><Check className="w-4 h-4"/> 5 {t('landing.mock_com_likes', { defaultValue: 'Likes' })}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4"/> 2 {t('landing.mock_com_replies', { defaultValue: 'Replies' })}</span>
                </div>
            </div>
        </div>
    </div>
)};

const GovtSchemesMock = () => {
    const { t } = useTranslation();
    return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 h-full w-full p-6 flex flex-col shadow-2xl relative overflow-hidden min-h-[400px]">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-amber-500" /> {t('landing.mock_scheme_title', { defaultValue: 'Active Govt Schemes' })}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">PM-KISAN</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t('landing.mock_scheme_pm_desc', { defaultValue: 'Financial benefit of ₹6,000 per year payable in three equal installments.' })}</p>
                </div>
                <button className="mt-3 text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg w-fit">{t('landing.mock_scheme_apply', { defaultValue: 'Apply Now' })}</button>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">Rythu Bandhu</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t('landing.mock_scheme_rb_desc', { defaultValue: 'Investment support for agriculture and horticulture crops in Telangana.' })}</p>
                </div>
                <button className="mt-3 text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg w-fit">{t('landing.mock_scheme_status', { defaultValue: 'Check Status' })}</button>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between sm:col-span-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">PM Fasal Bima Yojana</h4>
                        <p className="text-xs text-slate-500 mt-1">{t('landing.mock_scheme_fb_desc', { defaultValue: 'Crop insurance scheme for protection against natural calamities.' })}</p>
                    </div>
                    <ShieldCheck className="w-8 h-8 text-blue-500 opacity-20" />
                </div>
                <button className="mt-3 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">{t('landing.mock_scheme_view', { defaultValue: 'View Details' })}</button>
            </div>
        </div>
    </div>
)};

const AnalyticsMock = () => {
    const { t } = useTranslation();
    return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 h-full w-full p-6 flex flex-col shadow-2xl relative overflow-hidden min-h-[400px]">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" /> {t('landing.mock_analytics_title', { defaultValue: 'Farm Analytics' })}
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-500 font-bold uppercase">{t('landing.mock_analytics_rev', { defaultValue: 'Total Revenue (YTD)' })}</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">₹3,45,000</p>
                <p className="text-xs text-green-500 font-bold mt-1">↑ 12% {t('landing.mock_analytics_vs', { defaultValue: 'vs Last Year' })}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-500 font-bold uppercase">{t('landing.mock_analytics_exp', { defaultValue: 'Total Expenses' })}</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">₹1,12,000</p>
                <p className="text-xs text-slate-400 font-bold mt-1">{t('landing.mock_analytics_cat', { defaultValue: 'Fertilizer & Labor' })}</p>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex-1 flex flex-col">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-4">{t('landing.mock_analytics_profit', { defaultValue: 'Profit Margin Trend' })}</p>
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
                <span>{t('landing.mock_analytics_jan', { defaultValue: 'Jan' })}</span>
                <span>{t('landing.mock_analytics_jul', { defaultValue: 'Jul' })}</span>
            </div>
        </div>
    </div>
)};

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
                            {t('landing.logo_first', { defaultValue: 'Agri' })}<span className="text-green-600">{t('landing.logo_second', { defaultValue: 'Spine' })}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <LanguageSwitcher />
                        <button onClick={() => navigate('/login')} className="hidden sm:block text-slate-600 dark:text-slate-300 font-bold hover:text-green-600 dark:hover:text-green-400 transition-colors">
                            {t('landing.login', { defaultValue: 'Login' })}
                        </button>
                        <button onClick={() => navigate('/register')} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full font-bold hover:bg-green-600 dark:hover:bg-green-500 hover:text-white transition-all shadow-md">
                            {t('landing.register', { defaultValue: 'Register' })}
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 pt-20">
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-white dark:bg-slate-950 pt-24 pb-32 lg:pt-40 lg:pb-48 border-b border-slate-100 dark:border-slate-900">
                    <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-green-50 dark:from-green-950/20 to-transparent"></div>
                    <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                        {/* HERO TITLE - REDUCED SIZE */}
                        <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
                            {t('landing.hero_main_1', { defaultValue: 'AgriSpine — Your Complete' })} <br className="hidden lg:block"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">{t('landing.hero_main_2', { defaultValue: 'Digital Farming' })}</span> {t('landing.hero_main_3', { defaultValue: 'Companion' })}
                        </h1>
                        <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                            {t('landing.hero_desc', { defaultValue: 'Manage crops, automate labor settlements, track market prices, and stay connected with your village—all in one premium platform.' })}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row justify-center gap-6">
                            <button onClick={() => navigate('/register')} className="px-10 py-5 bg-green-600 hover:bg-green-700 text-white rounded-[2rem] font-black text-xl transition-all shadow-xl shadow-green-600/30 flex items-center justify-center gap-3 hover:scale-105 active:scale-95">
                                {t('landing.hero_btn_primary', { defaultValue: 'Join AgriSpine' })} <ArrowRight className="w-6 h-6" />
                            </button>
                            <button onClick={() => scrollTo('crops')} className="px-10 py-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-[2rem] font-black text-xl transition-all flex items-center justify-center gap-3 hover:scale-105 active:scale-95">
                                {t('landing.hero_btn_secondary', { defaultValue: 'Explore Features' })}
                            </button>
                        </div>
                    </div>
                </section>

                {/* FEATURE NAVIGATION */}
                <div className="sticky top-20 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-x-auto custom-scrollbar">
                    <div className="max-w-7xl mx-auto px-6 flex items-center gap-6 py-4 min-w-max">
                        {[
                            { id: 'crops', label: t('landing.nav_crops', { defaultValue: 'My Crops' }) },
                            { id: 'gramsathi', label: t('landing.nav_gramsathi', { defaultValue: 'GramSathi AI' }) },
                            { id: 'weather', label: t('landing.nav_weather', { defaultValue: 'Weather' }) },
                            { id: 'workgroups', label: t('landing.nav_workgroups', { defaultValue: 'Work Groups' }) },

                            { id: 'machinery', label: t('landing.nav_machinery', { defaultValue: 'Rent Machinery' }) },
                            { id: 'messenger', label: t('landing.nav_messenger', { defaultValue: 'Messenger' }) },
                            { id: 'community', label: t('landing.nav_community', { defaultValue: 'Community' }) },
                            { id: 'schemes', label: t('landing.nav_schemes', { defaultValue: 'Govt Schemes' }) },
                            { id: 'analytics', label: t('landing.nav_analytics', { defaultValue: 'Analytics' }) }
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
                    <FeatureSection 
                        id="crops"
                        title={t('landing.feat_crops_title', { defaultValue: 'Crop Lifecycle Management' })}
                        subtitle={t('landing.feat_crops_desc', { defaultValue: 'Track everything from sowing to harvesting. Monitor acreage, record expenses, and project your revenue effortlessly in a beautiful grid dashboard.' })}
                        icon={Sprout}
                        features={[
                            t('landing.feat_crops_1', { defaultValue: 'Full expense tracking' }),
                            t('landing.feat_crops_2', { defaultValue: 'Status badges (Active, Harvested, Sold)' }),
                            t('landing.feat_crops_3', { defaultValue: 'Automated yield calculations' }),
                            t('landing.feat_crops_4', { defaultValue: 'Rich data visualization' })
                        ]}
                        MockupComponent={CropsMock}
                        bgColor="bg-slate-50 dark:bg-slate-900/20"
                    />

                    <FeatureSection 
                        id="gramsathi"
                        reverse={true}
                        title={t('landing.feat_ai_title', { defaultValue: 'GramSathi AI Assistant' })}
                        subtitle={t('landing.feat_ai_desc', { defaultValue: 'Your intelligent farming companion. Ask questions about diseases, soil health, or market trends in your local language and get actionable advice.' })}
                        icon={Bot}
                        features={[
                            t('landing.feat_ai_1', { defaultValue: '24/7 agricultural intelligence' }),
                            t('landing.feat_ai_2', { defaultValue: 'Multilingual support' }),
                            t('landing.feat_ai_3', { defaultValue: 'Instant pesticide recommendations' }),
                            t('landing.feat_ai_4', { defaultValue: 'Direct integration with marketplace' })
                        ]}
                        MockupComponent={GramSathiMock}
                        bgColor="bg-white dark:bg-slate-950"
                    />

                    <FeatureSection 
                        id="weather"
                        title={t('landing.feat_weather_title', { defaultValue: 'Weather Intelligence' })}
                        subtitle={t('landing.feat_weather_desc', { defaultValue: 'Make critical decisions like when to sow or spray based on highly accurate, real-time micro-climate data for your exact farm location.' })}
                        icon={CloudSun}
                        features={[
                            t('landing.feat_weather_1', { defaultValue: 'Hyper-local precipitation alerts' }),
                            t('landing.feat_weather_2', { defaultValue: 'Hourly temperature tracking' }),
                            t('landing.feat_weather_3', { defaultValue: 'Spraying suitability indicator' }),
                            t('landing.feat_weather_4', { defaultValue: 'Severe weather warnings' })
                        ]}
                        MockupComponent={WeatherMock}
                        bgColor="bg-slate-50 dark:bg-slate-900/20"
                    />

                    <FeatureSection 
                        id="workgroups"
                        reverse={true}
                        title={t('landing.feat_wg_title', { defaultValue: 'Automated Labor Settlements' })}
                        subtitle={t('landing.feat_wg_desc', { defaultValue: 'Ditch the notebook. Track daily attendance for labor groups and let the system automatically calculate net payables, receivables, and internal farm deductions.' })}
                        icon={Users}
                        features={[
                            t('landing.feat_wg_1', { defaultValue: 'Automatic net settlement math' }),
                            t('landing.feat_wg_2', { defaultValue: 'Line-by-line payout breakdown' }),
                            t('landing.feat_wg_3', { defaultValue: 'Internal member farm support' }),
                            t('landing.feat_wg_4', { defaultValue: 'Partial payment tracking' })
                        ]}
                        MockupComponent={WorkGroupsMock}
                        bgColor="bg-white dark:bg-slate-950"
                    />



                    <FeatureSection 
                        id="machinery"
                        reverse={true}
                        title={t('landing.feat_machinery_title', { defaultValue: 'Machinery Rentals' })}
                        subtitle={t('landing.feat_machinery_desc', { defaultValue: 'Don\'t own a tractor or a drone? Find available machinery for rent from verified farmers nearby and book it instantly.' })}
                        icon={Tractor}
                        features={[
                            t('landing.feat_machinery_1', { defaultValue: 'GPS-based proximity matching' }),
                            t('landing.feat_machinery_2', { defaultValue: 'Hourly & daily rates' }),
                            t('landing.feat_machinery_3', { defaultValue: 'Drone spraying services' }),
                            t('landing.feat_machinery_4', { defaultValue: 'Verified owner reviews' })
                        ]}
                        MockupComponent={MachineryMock}
                        bgColor="bg-white dark:bg-slate-950"
                    />

                    <FeatureSection 
                        id="messenger"
                        title={t('landing.feat_msg_title', { defaultValue: 'Village Messenger' })}
                        subtitle={t('landing.feat_msg_desc', { defaultValue: 'Stay connected with your local community. Receive official announcements from the Panchayat, Agriculture Department, and other verified local authorities.' })}
                        icon={MessageSquare}
                        features={[
                            t('landing.feat_msg_1', { defaultValue: 'Real-time village announcements' }),
                            t('landing.feat_msg_2', { defaultValue: 'Government alert broadcasts' }),
                            t('landing.feat_msg_3', { defaultValue: 'Work group notifications' }),
                            t('landing.feat_msg_4', { defaultValue: 'Secure and verified senders' })
                        ]}
                        MockupComponent={MessengerMock}
                        bgColor="bg-slate-50 dark:bg-slate-900/20"
                    />

                    <FeatureSection 
                        id="community"
                        reverse={true}
                        title={t('landing.feat_com_title', { defaultValue: 'Farmers Forum' })}
                        subtitle={t('landing.feat_com_desc', { defaultValue: 'Join the conversation. Share experiences, ask for advice, or post listings for used equipment in a vibrant community of fellow farmers.' })}
                        icon={Users}
                        features={[
                            t('landing.feat_com_1', { defaultValue: 'Peer-to-peer knowledge sharing' }),
                            t('landing.feat_com_2', { defaultValue: 'Equipment classifieds' }),
                            t('landing.feat_com_3', { defaultValue: 'Upvote and reply system' }),
                            t('landing.feat_com_4', { defaultValue: 'Regional networking' })
                        ]}
                        MockupComponent={CommunityMock}
                        bgColor="bg-white dark:bg-slate-950"
                    />

                    <FeatureSection 
                        id="schemes"
                        title={t('landing.feat_scheme_title', { defaultValue: 'Government Schemes' })}
                        subtitle={t('landing.feat_scheme_desc', { defaultValue: 'Never miss out on financial aid or subsidies. Browse a curated list of active state and central government schemes with direct application links.' })}
                        icon={Landmark}
                        features={[
                            t('landing.feat_scheme_1', { defaultValue: 'PM-KISAN tracking' }),
                            t('landing.feat_scheme_2', { defaultValue: 'Crop insurance details' }),
                            t('landing.feat_scheme_3', { defaultValue: 'State-specific subsidies' }),
                            t('landing.feat_scheme_4', { defaultValue: 'Direct eligibility checks' })
                        ]}
                        MockupComponent={GovtSchemesMock}
                        bgColor="bg-slate-50 dark:bg-slate-900/20"
                    />

                    <FeatureSection 
                        id="analytics"
                        reverse={true}
                        title={t('landing.feat_analytics_title', { defaultValue: 'Farm Analytics' })}
                        subtitle={t('landing.feat_analytics_desc', { defaultValue: 'Understand your farm\'s financial health. Track total revenues, expenses, and profit margins over time with beautiful, easy-to-read charts.' })}
                        icon={BarChart3}
                        features={[
                            t('landing.feat_analytics_1', { defaultValue: 'Revenue vs Expense tracking' }),
                            t('landing.feat_analytics_2', { defaultValue: 'Profit margin trends' }),
                            t('landing.feat_analytics_3', { defaultValue: 'Year-over-year comparisons' }),
                            t('landing.feat_analytics_4', { defaultValue: 'Exportable reports' })
                        ]}
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
                            {t('landing.logo_first', { defaultValue: 'Agri' })}<span className="text-green-500">{t('landing.logo_second', { defaultValue: 'Spine' })}</span>
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">
                        © 2026 AgriSpine. {t('landing.footer_text', { defaultValue: 'Empowering modern agriculture.' })}
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
