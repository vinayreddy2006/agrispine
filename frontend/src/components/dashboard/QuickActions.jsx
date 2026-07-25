import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, CloudSun, MessageCircle, ShoppingBag, 
  TrendingUp, Sprout, Tractor, Users, Landmark, Info, Droplets, MapPin, Store, Wind, Briefcase
} from 'lucide-react';
import Card from '../ui/Card';

const QuickActions = ({ weather }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const actions = [
    {
      title: t('dashboard.analytics'),
      desc: t('dashboard.track_profit'),
      icon: <BarChart3 className="w-6 h-6" />,
      colorClass: "bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white",
      path: "/reports"
    },
    {
      title: t('dashboard.village'),
      desc: t('dashboard.village_desc'),
      icon: <MessageCircle className="w-6 h-6" />,
      colorClass: "bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white",
      path: "/messages"
    },
    {
      title: t('dashboard.buyer'),
      desc: t('dashboard.buyer_desc'),
      icon: <ShoppingBag className="w-6 h-6" />,
      colorClass: "bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white",
      path: "/buyer-market"
    },
    {
      title: t('dashboard.mandi'),
      desc: t('dashboard.mandi_desc'),
      icon: <TrendingUp className="w-6 h-6" />,
      colorClass: "bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white",
      path: "/market"
    },
    {
      title: t('dashboard.doctor'),
      desc: t('dashboard.doctor_desc'),
      icon: <Sprout className="w-6 h-6" />,
      colorClass: "bg-teal-100 text-teal-600 group-hover:bg-teal-600 group-hover:text-white",
      path: "/doctor"
    },
    {
      title: t('dashboard.rent'),
      desc: t('dashboard.rent_desc'),
      icon: <Tractor className="w-6 h-6" />,
      colorClass: "bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
      path: "/rent-machinery"
    },
    {
      title: t('dashboard.community'),
      desc: t('dashboard.community_desc'),
      icon: <Users className="w-6 h-6" />,
      colorClass: "bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white",
      path: "/community"
    },
    {
      title: t('dashboard.schemes'),
      desc: t('dashboard.schemes_desc'),
      icon: <Landmark className="w-6 h-6" />,
      colorClass: "bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white",
      path: "/schemes"
    },
    {
      title: t('dashboard.work_groups', { defaultValue: "Work Groups" }),
      desc: t('dashboard.work_groups_desc', { defaultValue: "Manage farm labor and daily settlements" }),
      icon: <Briefcase className="w-6 h-6" />,
      colorClass: "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
      path: "/groups"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {/* Weather Widget */}
      <Card className="relative overflow-hidden group border-orange-100 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-900/20 col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 p-6">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <CloudSun className="w-32 h-32 text-orange-600" />
        </div>
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="bg-orange-100 dark:bg-orange-900/40 p-3 rounded-xl text-orange-600 dark:text-orange-400">
            <CloudSun className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg">{t('dashboard.weather')}</h3>
        </div>
        {weather ? (
          <div className="relative z-10 w-full flex justify-between items-end">
            <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">{weather.temp}°C</span>
                  <span className="text-lg text-gray-600 dark:text-gray-400 font-medium capitalize">{weather.condition}</span>
                </div>
                <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
                    <span className="flex items-center gap-1"><Droplets className="w-4 h-4" /> {weather.humidity}% Humidity</span>
                    <span className="flex items-center gap-1"><Wind className="w-4 h-4" /> {weather.wind} m/s Wind</span>
                    {weather.temp_min && weather.temp_max && (
                        <span className="flex items-center gap-1 hidden sm:flex"> H: {weather.temp_max}° L: {weather.temp_min}°</span>
                    )}
                </div>
            </div>
            <button onClick={() => navigate('/weather')} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm">
                View Full Weather
            </button>
          </div>
        ) : (
          <div className="animate-pulse flex flex-col gap-3 relative z-10">
            <div className="h-12 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        )}
      </Card>

      {/* Action Cards */}
      {actions.map((action, index) => (
        <Card 
          key={index} 
          hover 
          onClick={() => navigate(action.path)}
          className="group flex flex-col p-6 h-full dark:bg-slate-800 dark:border-slate-700 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300"
        >
          <div className={`p-4 rounded-2xl w-fit mb-5 transition-colors duration-300 ${action.colorClass}`}>
            {React.cloneElement(action.icon, { className: "w-7 h-7" })}
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{action.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-grow">{action.desc}</p>
        </Card>
      ))}
    </div>
  );
};

export default QuickActions;
