import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, CloudSun, MessageCircle, ShoppingBag, 
  TrendingUp, Sprout, Tractor, Users, Landmark, Info, 
  Droplets, MapPin, Store, Wind, Briefcase, ChevronRight, 
  AlertCircle, RefreshCw, CheckCircle2 
} from 'lucide-react';
import Card from '../ui/Card';

const QuickActions = ({ weather, weatherLoading = false, weatherError = null, onConfirmLocation, onRetryWeather }) => {
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
      <Card className="relative overflow-hidden group border-emerald-150 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 p-6 shadow-sm">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <CloudSun className="w-36 h-36 text-emerald-600" />
        </div>

        <div className="flex items-center justify-between mb-4 relative z-10 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2.5 rounded-2xl text-emerald-700 dark:text-emerald-300">
              <CloudSun className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                  {t('dashboard.weather')}
                </h3>
                {weather?.isLocationConfirmed ? (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                    My Farm Location
                  </span>
                ) : (
                  <button
                    onClick={onConfirmLocation}
                    className="text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-0.5 rounded-full transition cursor-pointer"
                  >
                    Confirm Location
                  </button>
                )}
              </div>
              {weather?.locationName && (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>{weather.locationName}</span>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/weather')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold shadow-sm transition text-xs flex items-center gap-1.5"
          >
            <span>View Full Weather & Forecast</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {weatherLoading ? (
          <div className="animate-pulse flex items-center gap-4 py-3 relative z-10">
            <div className="h-14 w-28 bg-emerald-100 dark:bg-slate-800 rounded-2xl"></div>
            <div className="space-y-2">
              <div className="h-5 w-40 bg-emerald-100 dark:bg-slate-800 rounded-xl"></div>
              <div className="h-4 w-56 bg-emerald-100 dark:bg-slate-800 rounded-xl"></div>
            </div>
          </div>
        ) : weather && weather.status !== 'error' && weather.temp !== undefined ? (
          <div className="relative z-10 w-full flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-1">
            <div>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                  {weather.temp}°C
                </span>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 capitalize bg-emerald-100/70 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-xl">
                  {weather.condition}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1 bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" /> {weather.humidity}% Humidity
                </span>
                <span className="flex items-center gap-1 bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  <Wind className="w-3.5 h-3.5 text-teal-500" /> {weather.wind} m/s Wind Speed
                </span>
                {weather.temp_min !== undefined && weather.temp_max !== undefined && (
                  <span className="flex items-center gap-1 bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700">
                    High: {weather.temp_max}° • Low: {weather.temp_min}°
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{weather?.errorMessage || weatherError || "Weather information could not be retrieved."}</span>
            </div>
            {onRetryWeather && (
              <button
                onClick={onRetryWeather}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition"
              >
                Retry
              </button>
            )}
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
