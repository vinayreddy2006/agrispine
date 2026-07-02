import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { CloudSun, Droplets, Wind, Thermometer, Calendar, Clock, Sun, Sunrise, Sunset, Eye, Compass, CloudRain, AlertTriangle, Lock } from 'lucide-react';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/common/PageHeader';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const API_KEY = "35e669987b8f3f982e649b224ed22c0c";

const Weather = () => {
    const { t } = useTranslation();
    const [currentWeather, setCurrentWeather] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFullWeather = async () => {
            try {
                const userStr = localStorage.getItem('user');
                if (!userStr) return;
                const user = JSON.parse(userStr);
                const district = user.district || "Hyderabad";

                const currentRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${district}&units=metric&appid=${API_KEY}`);
                const forecastRes = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${district}&units=metric&appid=${API_KEY}`);

                setCurrentWeather(currentRes.data);

                const processedForecast = forecastRes.data.list.slice(0, 8).map(item => ({
                    time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    temp: Math.round(item.main.temp),
                    rain: item.pop ? Math.round(item.pop * 100) : 0,
                    icon: item.weather[0].icon,
                    desc: item.weather[0].main
                }));

                setForecast(processedForecast);
            } catch (error) {
                console.error("Error fetching full weather:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFullWeather();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (!currentWeather) {
        return (
            <div className="p-6 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl m-6 border border-red-200 dark:border-red-800">
                Failed to load weather data. Please check your internet connection or API Key.
            </div>
        );
    }

    const sunrise = new Date(currentWeather.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sunset = new Date(currentWeather.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isRaining = currentWeather.weather[0].main.toLowerCase().includes('rain');
    const highWind = currentWeather.wind.speed > 5;

    return (
        <div className="space-y-6 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <PageHeader
                title="Agri Weather"
                subtitle={`Precision forecasts for ${currentWeather.name}, ${currentWeather.sys.country}`}
            />

            {/* Main Weather Banner */}
            <div className="bg-gradient-to-br from-orange-400 via-orange-500 to-rose-500 rounded-3xl shadow-lg shadow-orange-500/20 overflow-hidden relative text-white">
                <CloudSun className="absolute -right-10 -top-10 w-80 h-80 text-white opacity-10" />
                <div className="p-8 md:p-10 relative z-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium mb-4 inline-flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span> Live Data
                        </span>
                        <div className="flex items-center gap-4">
                            <span className="text-8xl font-black tracking-tighter drop-shadow-md">{Math.round(currentWeather.main.temp)}°</span>
                        </div>
                        <p className="text-3xl font-bold capitalize mt-1 drop-shadow">{currentWeather.weather[0].description}</p>
                        <p className="mt-2 text-orange-50 font-medium">Feels like {Math.round(currentWeather.main.feels_like)}°C</p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-12 gap-y-6 bg-black/20 backdrop-blur-md p-8 rounded-3xl border border-white/10 w-full md:w-auto shadow-2xl">
                        <div className="flex flex-col gap-1">
                            <span className="text-orange-100/80 text-sm font-medium flex items-center gap-1.5"><Droplets className="w-4 h-4" /> Humidity</span>
                            <span className="font-bold text-2xl">{currentWeather.main.humidity}%</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-orange-100/80 text-sm font-medium flex items-center gap-1.5"><Wind className="w-4 h-4" /> Wind</span>
                            <span className="font-bold text-2xl">{currentWeather.wind.speed} m/s</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-orange-100/80 text-sm font-medium flex items-center gap-1.5"><Sunrise className="w-4 h-4" /> Sunrise</span>
                            <span className="font-bold text-2xl">{sunrise}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-orange-100/80 text-sm font-medium flex items-center gap-1.5"><Sunset className="w-4 h-4" /> Sunset</span>
                            <span className="font-bold text-2xl">{sunset}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 24 Hour Forecast Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-orange-500" />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">24-Hour Timeline</h3>
                            </div>
                        </div>
                        
                        <div className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar">
                            {forecast.map((item, idx) => (
                                <div key={idx} className="flex flex-col items-center justify-center p-4 min-w-[100px] rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-orange-200 dark:hover:border-orange-500/30 transition-colors">
                                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-3">{item.time}</span>
                                    <img src={`https://openweathermap.org/img/wn/${item.icon}.png`} alt={item.desc} className="w-10 h-10 mb-2" />
                                    <span className="text-lg font-bold text-slate-800 dark:text-white">{item.temp}°</span>
                                    <span className="text-xs font-semibold text-blue-500 mt-1 flex items-center gap-1">
                                        <CloudRain className="w-3 h-3" /> {item.rain}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-6 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Temperature Trend</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={forecast}>
                                    <defs>
                                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" activeDot={{ r: 6, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }} name="Temp (°C)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className={`p-6 border-l-4 ${isRaining ? 'bg-blue-50 dark:bg-blue-900/20 border-l-blue-500' : highWind ? 'bg-amber-50 dark:bg-amber-900/20 border-l-amber-500' : 'bg-green-50 dark:bg-green-900/20 border-l-green-500'}`}>
                        <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${isRaining ? 'text-blue-700 dark:text-blue-400' : highWind ? 'text-amber-700 dark:text-amber-400' : 'text-green-700 dark:text-green-400'}`}>
                            <AlertTriangle className="w-5 h-5" /> Agri Recommendations
                        </h3>
                        <div className="space-y-4 text-sm font-medium">
                            <p className="text-slate-700 dark:text-slate-300">
                                <strong>Spraying:</strong> {isRaining ? "Not recommended (Rain will wash away chemicals)." : highWind ? "Not recommended (High wind causes drift)." : "Optimal conditions for spraying."}
                            </p>
                            <p className="text-slate-700 dark:text-slate-300">
                                <strong>Irrigation:</strong> {isRaining ? "Pause irrigation to save water." : "Normal irrigation schedule applies."}
                            </p>
                            <p className="text-slate-700 dark:text-slate-300">
                                <strong>Harvesting:</strong> {isRaining ? "Halt harvesting to prevent crop damage." : "Safe to harvest."}
                            </p>
                        </div>
                    </Card>

                    <Card className="p-6 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Atmospherics</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium"><Eye className="w-4 h-4" /> Visibility</span>
                                <span className="font-bold text-slate-800 dark:text-white">{(currentWeather.visibility / 1000).toFixed(1)} km</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium"><Compass className="w-4 h-4" /> Pressure</span>
                                <span className="font-bold text-slate-800 dark:text-white">{currentWeather.main.pressure} hPa</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium"><CloudSun className="w-4 h-4" /> Cloud Cover</span>
                                <span className="font-bold text-slate-800 dark:text-white">{currentWeather.clouds.all}%</span>
                            </div>
                        </div>
                    </Card>

                    {/* API Limitations Disclosure */}
                    <Card className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 border-dashed shadow-none">
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                            <Lock className="w-4 h-4" /> Premium Metrics
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                            The following data points require an upgrade to the <strong>OpenWeatherMap One Call API 3.0</strong> subscription endpoint and are currently unavailable in the standard API tier:
                        </p>
                        <ul className="space-y-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
                            <li className="flex items-center gap-2 opacity-50"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> UV Index</li>
                            <li className="flex items-center gap-2 opacity-50"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> Air Quality Index (AQI)</li>
                            <li className="flex items-center gap-2 opacity-50"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> Dew Point</li>
                            <li className="flex items-center gap-2 opacity-50"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> Hourly Precipitation Volume</li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Weather;
