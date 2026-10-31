import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
    CloudSun, Droplets, Wind, Thermometer, Calendar, Clock, Sun,
    Sunrise, Sunset, Eye, Compass, CloudRain, AlertTriangle, CheckCircle,
    XCircle, HelpCircle, MapPin, Search, Navigation, RefreshCw,
    Sparkles, ShieldCheck, Home, ArrowRight, Gauge, ChevronRight, X
} from 'lucide-react';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/common/PageHeader';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || "35e669987b8f3f982e649b224ed22c0c";

// Helper: Calculate Dew Point using Magnus-Tetens Formula
const calculateDewPoint = (temp, humidity) => {
    if (temp === undefined || humidity === undefined || humidity <= 0) return null;
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
    const dewPoint = (b * alpha) / (a - alpha);
    return Math.round(dewPoint * 10) / 10;
};

// Helper: Convert degrees to compass direction
const getWindDirection = (deg) => {
    if (deg === undefined || deg === null) return 'N/A';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round((deg % 360) / 22.5) % 16;
    return directions[index];
};

// Helper: Format timezone offset into local time
const formatLocalTime = (timestamp, timezoneOffsetSeconds, options = { hour: '2-digit', minute: '2-digit', hour12: false }) => {
    if (!timestamp) return '--:--';
    // UTC time in milliseconds + city timezone offset in milliseconds
    const utcDate = new Date(timestamp * 1000);
    const localTimestamp = (timestamp + (timezoneOffsetSeconds || 0)) * 1000;
    const localDate = new Date(localTimestamp);
    
    // Format UTC hours/minutes of the shifted date to prevent browser local timezone distortion
    const hours = String(localDate.getUTCHours()).padStart(2, '0');
    const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

// Helper: Get local date string YYYY-MM-DD for grouping
const getLocalDateKey = (timestamp, timezoneOffsetSeconds) => {
    const localDate = new Date((timestamp + (timezoneOffsetSeconds || 0)) * 1000);
    const year = localDate.getUTCFullYear();
    const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(localDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper: Generate day header label with relative indicator
const formatDayHeader = (dateKey, todayKey, tomorrowKey, timezoneOffsetSeconds) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' });

    if (dateKey === todayKey) {
        return `TODAY — ${weekday}, ${formattedDate}`;
    }
    if (dateKey === tomorrowKey) {
        return `TOMORROW — ${weekday}, ${formattedDate}`;
    }
    return `${weekday} — ${formattedDate}`;
};

// Helper: Resolve a location query (village, district, state) to coordinates using OpenWeatherMap Geocoding API
const resolveLocationCoordinates = async ({ village = '', district = '', state = '', country = 'IN' }) => {
    const v = (village || '').trim();
    const d = (district || '').trim();
    const s = (state || '').trim();
    const c = (country || 'IN').trim();

    // Candidate search strings in descending order of precision
    const candidates = [];
    if (v && s) candidates.push(`${v}, ${s}, ${c}`);
    if (v && d) candidates.push(`${v}, ${d}`);
    if (v) candidates.push(`${v}, ${c}`);
    if (v) candidates.push(v);
    if (d && s) candidates.push(`${d}, ${s}, ${c}`);
    if (d) candidates.push(`${d}, ${c}`);
    if (d) candidates.push(d);

    for (const q of candidates) {
        try {
            const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${API_KEY}`;
            const res = await axios.get(geoUrl);
            const results = res.data;
            if (Array.isArray(results) && results.length > 0) {
                let bestMatch = results[0];
                if (s) {
                    const stateMatch = results.find(item => item.state && item.state.toLowerCase() === s.toLowerCase());
                    if (stateMatch) bestMatch = stateMatch;
                }
                if (d && !s) {
                    const distMatch = results.find(item => 
                        (item.name && item.name.toLowerCase() === d.toLowerCase()) || 
                        (item.state && item.state.toLowerCase().includes(d.toLowerCase()))
                    );
                    if (distMatch) bestMatch = distMatch;
                }

                const resolvedName = v || bestMatch.name;
                const displayParts = [resolvedName, bestMatch.state || s || d, bestMatch.country || c].filter(Boolean);

                return {
                    name: resolvedName,
                    displayName: displayParts.join(', '),
                    village: v,
                    district: d || bestMatch.name,
                    state: bestMatch.state || s,
                    country: bestMatch.country || c,
                    lat: bestMatch.lat,
                    lon: bestMatch.lon
                };
            }
        } catch (e) {
            console.warn(`Geocoding query "${q}" failed:`, e.message);
        }
    }

    // Secondary fallback: Direct city weather lookup for district (e.g. Nalgonda)
    if (d) {
        try {
            const checkUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(d)}&appid=${API_KEY}`;
            const res = await axios.get(checkUrl);
            if (res.data && res.data.coord) {
                const resolvedName = v || res.data.name;
                return {
                    name: resolvedName,
                    displayName: [resolvedName, d, res.data.sys?.country || c].filter(Boolean).join(', '),
                    village: v,
                    district: d,
                    state: s,
                    country: res.data.sys?.country || c,
                    lat: res.data.coord.lat,
                    lon: res.data.coord.lon
                };
            }
        } catch (e) {
            console.warn(`Direct city lookup failed for "${d}":`, e.message);
        }
    }

    return null;
};

const Weather = () => {
    const { t } = useTranslation();

    // 1. Location state: Default to user profile, allow temporary selection without modifying profile
    const [profileLocation, setProfileLocation] = useState({ name: 'Hyderabad', displayName: 'Hyderabad, Telangana, IN', village: '', district: 'Hyderabad', country: 'IN', lat: 17.360589, lon: 78.4740613 });
    const [currentLocation, setCurrentLocation] = useState({ name: 'Hyderabad', displayName: 'Hyderabad, Telangana, IN', isFarmLocation: true, lat: 17.360589, lon: 78.4740613, country: 'IN' });

    // Weather & forecast state
    const [currentWeather, setCurrentWeather] = useState(null);
    const [forecastList, setForecastList] = useState([]);
    const [forecastGroups, setForecastGroups] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    // Location search & modal state
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    // Recommendations state
    const [recommendations, setRecommendations] = useState([]);
    const [recomSource, setRecomSource] = useState('rule-based');
    const [recomModel, setRecomModel] = useState('');
    const [recomLoading, setRecomLoading] = useState(true);

    const searchInputRef = useRef(null);

    // Initialize Profile Location on Mount (Scenario A & D: Profile location is always default on mount)
    useEffect(() => {
        let isMounted = true;

        const initProfileWeather = async () => {
            setLoading(true);
            setErrorMessage(null);

            try {
                let village = '';
                let district = '';
                let state = '';
                let savedLat = null;
                let savedLon = null;

                // 1. Read from localStorage for immediate user session state
                const userStr = localStorage.getItem('user');
                const token = localStorage.getItem('token');

                if (userStr) {
                    try {
                        const user = JSON.parse(userStr);
                        village = user.village?.trim() || '';
                        district = user.district?.trim() || '';
                        state = user.state?.trim() || '';
                        if (user.lat && user.lon) {
                            savedLat = Number(user.lat);
                            savedLon = Number(user.lon);
                        }
                    } catch (parseErr) {
                        console.warn('Failed to parse user from localStorage:', parseErr);
                    }
                }

                // 2. If authenticated, fetch fresh profile from backend to ensure up-to-date fields
                if (token && (!village || !district)) {
                    try {
                        const userRes = await api.post('/auth/getuser', {}, { headers: { 'auth-token': token } });
                        if (userRes.data) {
                            const u = userRes.data;
                            if (u.village) village = u.village.trim();
                            if (u.district) district = u.district.trim();
                            if (u.state) state = u.state.trim();
                            if (u.lat && u.lon) {
                                savedLat = Number(u.lat);
                                savedLon = Number(u.lon);
                            }
                        }
                    } catch (apiErr) {
                        console.warn('Could not refresh profile from backend:', apiErr.message);
                    }
                }

                if (!isMounted) return;

                // 3. If numeric coordinates are already saved in profile, use them directly
                if (savedLat !== null && savedLon !== null && !isNaN(savedLat) && !isNaN(savedLon)) {
                    const farmLoc = {
                        name: village || district || 'My Farm',
                        displayName: [village, district, state, 'IN'].filter(Boolean).join(', '),
                        village,
                        district,
                        state,
                        country: 'IN',
                        isFarmLocation: true,
                        lat: savedLat,
                        lon: savedLon
                    };
                    setProfileLocation(farmLoc);
                    setCurrentLocation(farmLoc);
                    await fetchWeatherForLocation(farmLoc);
                    return;
                }

                // 4. Resolve saved village/district using geocoding service
                if (village || district) {
                    const resolved = await resolveLocationCoordinates({ village, district, state, country: 'IN' });
                    if (resolved && isMounted) {
                        const farmLoc = {
                            ...resolved,
                            isFarmLocation: true
                        };
                        setProfileLocation(farmLoc);
                        setCurrentLocation(farmLoc);
                        await fetchWeatherForLocation(farmLoc);
                        return;
                    }
                }

                // 5. Default fallback if user has no saved location or resolution failed
                const fallbackLoc = {
                    name: 'Hyderabad',
                    displayName: 'Hyderabad, Telangana, IN',
                    village: '',
                    district: 'Hyderabad',
                    state: 'Telangana',
                    country: 'IN',
                    isFarmLocation: false,
                    lat: 17.360589,
                    lon: 78.4740613
                };
                if (isMounted) {
                    setProfileLocation(fallbackLoc);
                    setCurrentLocation(fallbackLoc);
                    await fetchWeatherForLocation(fallbackLoc);
                }

            } catch (err) {
                console.error('Error initializing user weather location:', err);
                if (isMounted) {
                    const fallbackLoc = {
                        name: 'Hyderabad',
                        displayName: 'Hyderabad, Telangana, IN',
                        isFarmLocation: false,
                        lat: 17.360589,
                        lon: 78.4740613
                    };
                    setCurrentLocation(fallbackLoc);
                    fetchWeatherForLocation(fallbackLoc);
                }
            }
        };

        initProfileWeather();

        return () => {
            isMounted = false;
        };
    }, []);

    // Fetch Weather Data from OpenWeatherMap API
    const fetchWeatherForLocation = async (targetLoc) => {
        setLoading(true);
        setErrorMessage(null);

        try {
            let activeLoc = { ...targetLoc };

            // Ensure coordinates: if lat/lon are missing, resolve them via geocoding
            if (!activeLoc.lat || !activeLoc.lon) {
                const resolved = await resolveLocationCoordinates({
                    village: activeLoc.village || activeLoc.name,
                    district: activeLoc.district,
                    state: activeLoc.state,
                    country: activeLoc.country || 'IN'
                });
                if (resolved) {
                    activeLoc = { ...activeLoc, ...resolved };
                }
            }

            let currentUrl = '';
            let forecastUrl = '';

            if (activeLoc.lat && activeLoc.lon) {
                currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${activeLoc.lat}&lon=${activeLoc.lon}&units=metric&appid=${API_KEY}`;
                forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${activeLoc.lat}&lon=${activeLoc.lon}&units=metric&appid=${API_KEY}`;
            } else {
                currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(activeLoc.name)}&units=metric&appid=${API_KEY}`;
                forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(activeLoc.name)}&units=metric&appid=${API_KEY}`;
            }

            let currentRes;
            let forecastRes;

            try {
                [currentRes, forecastRes] = await Promise.all([
                    axios.get(currentUrl),
                    axios.get(forecastUrl)
                ]);
            } catch (firstErr) {
                // If village or specific town wasn't recognized by OpenWeatherMap, fallback to District
                if (activeLoc.district && activeLoc.name !== activeLoc.district) {
                    console.warn(`Location '${activeLoc.name}' not found. Falling back to district '${activeLoc.district}'.`);
                    const fallbackCurrentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(activeLoc.district)}&units=metric&appid=${API_KEY}`;
                    const fallbackForecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(activeLoc.district)}&units=metric&appid=${API_KEY}`;
                    [currentRes, forecastRes] = await Promise.all([
                        axios.get(fallbackCurrentUrl),
                        axios.get(fallbackForecastUrl)
                    ]);
                } else {
                    throw firstErr;
                }
            }

            const currentData = currentRes.data;
            const forecastData = forecastRes.data;
            const cityTimezone = forecastData.city?.timezone ?? currentData.timezone ?? 19800;

            setCurrentWeather(currentData);
            setForecastList(forecastData.list || []);

            // -------------------------------------------------------------
            // Process 24-Hour & 48-Hour Forecast with Clear Day Transitions
            // -------------------------------------------------------------
            const todayKey = getLocalDateKey(currentData.dt, cityTimezone);
            // Calculate tomorrow key in local timezone
            const tomorrowTimestamp = currentData.dt + 86400;
            const tomorrowKey = getLocalDateKey(tomorrowTimestamp, cityTimezone);

            // Group entries by local calendar date (Scenario 5: 24h timeline day grouping)
            const groupsMap = {};
            const chartPoints = [];

            (forecastData.list || []).slice(0, 16).forEach(item => {
                const dateKey = getLocalDateKey(item.dt, cityTimezone);
                const timeLabel = formatLocalTime(item.dt, cityTimezone);
                const dewPoint = item.main?.dew_point ?? calculateDewPoint(item.main?.temp, item.main?.humidity);

                const processedItem = {
                    dt: item.dt,
                    time: timeLabel,
                    dateKey,
                    temp: Math.round(item.main.temp),
                    feelsLike: Math.round(item.main.feels_like),
                    dewPoint,
                    rainProb: item.pop ? Math.round(item.pop * 100) : 0,
                    rainVolume: item.rain?.['3h'] || 0,
                    windSpeed: Math.round((item.wind?.speed || 0) * 10) / 10,
                    windDirection: getWindDirection(item.wind?.deg),
                    icon: item.weather?.[0]?.icon || '01d',
                    desc: item.weather?.[0]?.description || item.weather?.[0]?.main || 'Clear'
                };

                if (!groupsMap[dateKey]) {
                    groupsMap[dateKey] = {
                        dateKey,
                        dayHeader: formatDayHeader(dateKey, todayKey, tomorrowKey, cityTimezone),
                        items: []
                    };
                }
                groupsMap[dateKey].items.push(processedItem);

                // Add to temperature chart data (first 8 entries = ~24 hours)
                if (chartPoints.length < 8) {
                    chartPoints.push({
                        time: timeLabel,
                        temp: Math.round(item.main.temp),
                        rain: item.pop ? Math.round(item.pop * 100) : 0,
                        dateHeader: dateKey === todayKey ? 'Today' : 'Tomorrow'
                    });
                }
            });

            setForecastGroups(Object.values(groupsMap));
            setChartData(chartPoints);

            // Fetch dynamic agricultural recommendations
            fetchRecommendations(currentData, forecastData, targetLoc.displayName || targetLoc.name);

        } catch (err) {
            console.error('Failed to fetch weather:', err);
            setErrorMessage(err.response?.data?.message || 'Could not load weather for this location. Please check your internet connection or search another town/city.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Fetch Agricultural Recommendations from Backend (incorporating Gemini & User Crop Context)
    const fetchRecommendations = async (weatherData, forecastData, locName) => {
        setRecomLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'auth-token': token } : {};
            
            const response = await api.post(
                '/api/ai/weather-recommendations',
                {
                    weather: weatherData,
                    forecast: forecastData,
                    locationName: locName
                },
                { headers }
            );

            if (response.data?.success && Array.isArray(response.data.recommendations)) {
                setRecommendations(response.data.recommendations);
                setRecomSource(response.data.source || 'rule-based');
                setRecomModel(response.data.model || 'Rules Engine');
            } else {
                throw new Error('Invalid recommendation payload');
            }
        } catch (err) {
            console.warn('Backend recommendation API failed, applying client-side agrometeorological rules:', err.message);
            // Fallback client-side rule evaluation to guarantee the UI never shows broken data
            generateClientFallbackRecommendations(weatherData, forecastData);
        } finally {
            setRecomLoading(false);
        }
    };

    // Client-side fallback if backend AI service is unreachable
    const generateClientFallbackRecommendations = (weather, forecast) => {
        const temp = weather?.main?.temp ?? 25;
        const humidity = weather?.main?.humidity ?? 50;
        const wind = weather?.wind?.speed ?? 2;
        const isRain = (weather?.weather?.[0]?.main || '').toLowerCase().includes('rain');
        const next12hPop = (forecast?.list || []).slice(0, 4).reduce((max, i) => Math.max(max, Math.round((i.pop || 0) * 100)), 0);

        let sprayStatus = 'favorable';
        let sprayAdvice = 'Optimal weather for spraying operations. Moderate breeze and acceptable humidity minimize droplet drift.';
        let sprayReason = `Wind is ${wind} m/s and rain chance is ${next12hPop}%. Safe rainfastness window available.`;
        if (isRain || next12hPop > 40) {
            sprayStatus = 'unfavorable';
            sprayAdvice = 'Halt all spraying operations. Rain will wash active chemicals off leaves.';
            sprayReason = `High rain probability (${next12hPop}%). Risk of chemical wash-off and ground run-off.`;
        } else if (wind > 5.5) {
            sprayStatus = 'unfavorable';
            sprayAdvice = 'Postpone chemical spraying. Strong winds create a high risk of spray drift.';
            sprayReason = `Wind speed of ${wind} m/s exceeds the recommended 5 m/s threshold.`;
        } else if (temp > 33 && humidity < 40) {
            sprayStatus = 'caution';
            sprayAdvice = 'Avoid spraying during peak heat. Spray early morning or after 17:00 to avoid leaf burn.';
            sprayReason = `High temperature (${temp}°C) and low humidity cause rapid droplet evaporation.`;
        }

        let irrStatus = 'favorable';
        let irrAdvice = 'Maintain standard irrigation schedule to meet crop evapotranspiration demand.';
        let irrReason = `Low rain likelihood (${next12hPop}%). Normal soil moisture depletion expected.`;
        if (isRain || next12hPop > 50) {
            irrStatus = 'unfavorable';
            irrAdvice = 'Pause irrigation. Rain is forecast for your fields.';
            irrReason = `Rain probability is ${next12hPop}%. Over-watering causes root asphyxiation and nutrient leaching.`;
        } else if (next12hPop >= 25) {
            irrStatus = 'caution';
            irrAdvice = 'Delay scheduled irrigation by 24h to observe incoming cloud accumulation.';
            irrReason = `Chance of showers (${next12hPop}%) may satisfy immediate water needs.`;
        }

        let harvestStatus = 'favorable';
        let harvestAdvice = 'Safe and favorable weather for harvesting, picking, and sun-drying produce.';
        let harvestReason = `Clear conditions with minimal rain likelihood (${next12hPop}%).`;
        if (isRain || next12hPop > 35) {
            harvestStatus = 'unfavorable';
            harvestAdvice = 'Halt harvesting and secure harvested crop under tarpaulins.';
            harvestReason = `Showers expected. Wet produce risks grain rot and mold development.`;
        } else if (humidity > 78) {
            harvestStatus = 'caution';
            harvestAdvice = 'Proceed with caution for mature plots. Ensure prompt shelter for harvested produce.';
            harvestReason = `High humidity (${humidity}%) slows down natural field drying.`;
        }

        let fieldStatus = 'favorable';
        let fieldAdvice = 'Favorable conditions for tractor field preparation, weeding, and fertilizer top-dressing.';
        let fieldReason = `Calm wind (${wind} m/s) and workable ground conditions ensure effective operations.`;
        if (isRain || next12hPop > 55) {
            fieldStatus = 'unfavorable';
            fieldAdvice = 'Avoid tractor operations and urea/nitrogen top-dressing.';
            fieldReason = `Heavy moisture causes tractor tire slippage and washes away broadcast fertilizer.`;
        }

        setRecommendations([
            { id: 'spraying', activity: 'Spraying Operations', status: sprayStatus, statusLabel: sprayStatus === 'favorable' ? 'Favorable' : sprayStatus === 'caution' ? 'Caution' : 'Unfavorable', advice: sprayAdvice, reason: sprayReason, metrics: { wind: `${wind} m/s`, rainChance: `${next12hPop}%`, temp: `${temp}°C` }, timeWindow: 'Next 6–12 Hours' },
            { id: 'irrigation', activity: 'Irrigation Planning', status: irrStatus, statusLabel: irrStatus === 'favorable' ? 'Favorable' : irrStatus === 'caution' ? 'Caution' : 'Unfavorable', advice: irrAdvice, reason: irrReason, metrics: { rainChance: `${next12hPop}%`, temp: `${temp}°C` }, timeWindow: 'Next 24–48 Hours' },
            { id: 'harvesting', activity: 'Harvesting & Post-Harvest Drying', status: harvestStatus, statusLabel: harvestStatus === 'favorable' ? 'Favorable' : harvestStatus === 'caution' ? 'Caution' : 'Unfavorable', advice: harvestAdvice, reason: harvestReason, metrics: { rainChance: `${next12hPop}%`, humidity: `${humidity}%` }, timeWindow: 'Next 24–48 Hours' },
            { id: 'field_work', activity: 'Field Work & Fertilizer Application', status: fieldStatus, statusLabel: fieldStatus === 'favorable' ? 'Favorable' : fieldStatus === 'caution' ? 'Caution' : 'Unfavorable', advice: fieldAdvice, reason: fieldReason, metrics: { wind: `${wind} m/s`, temp: `${temp}°C` }, timeWindow: 'Today / Next 24 Hours' }
        ]);
        setRecomSource('rule-based');
        setRecomModel('Agrometeorological Rules Engine');
    };

    // Location search handler using OpenWeatherMap Direct Geocoding API
    const handleLocationSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim() || searchQuery.length < 2) return;

        setSearching(true);
        try {
            const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchQuery)}&limit=5&appid=${API_KEY}`;
            const res = await axios.get(geoUrl);
            setSearchResults(res.data || []);
        } catch (err) {
            console.error('Location search error:', err);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    // Select Temporary Location (Scenario B & C: Updates weather, does NOT modify user profile)
    const handleSelectLocation = (place) => {
        const selected = {
            name: place.name,
            displayName: [place.name, place.state, place.country].filter(Boolean).join(', '),
            isFarmLocation: false, // Explicitly marked as temporary alternative
            lat: place.lat,
            lon: place.lon,
            country: place.country || 'IN',
            state: place.state
        };

        setCurrentLocation(selected);
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        fetchWeatherForLocation(selected);
    };

    // Use Device Geolocation (GPS)
    const handleUseDeviceLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }

        setSearching(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const revUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
                    const res = await axios.get(revUrl);
                    const place = res.data?.[0];
                    const selected = {
                        name: place?.name || 'Device Location',
                        displayName: place ? `${place.name}${place.state ? `, ${place.state}` : ''}, ${place.country}` : 'Current Location',
                        isFarmLocation: false,
                        lat: latitude,
                        lon: longitude
                    };
                    setCurrentLocation(selected);
                    setSearchOpen(false);
                    fetchWeatherForLocation(selected);
                } catch (e) {
                    console.error('Reverse geocode error:', e);
                    const selected = { name: 'Device Location', displayName: 'Current Location', isFarmLocation: false, lat: latitude, lon: longitude };
                    setCurrentLocation(selected);
                    setSearchOpen(false);
                    fetchWeatherForLocation(selected);
                } finally {
                    setSearching(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                setSearching(false);
                alert('Could not retrieve your device location. Please search manually.');
            }
        );
    };

    // Reset to Farmer's Saved Profile Location (Scenario C & D)
    const handleResetToFarmLocation = () => {
        setCurrentLocation(profileLocation);
        fetchWeatherForLocation(profileLocation);
    };

    // Manual Refresh
    const handleRefresh = () => {
        setRefreshing(true);
        fetchWeatherForLocation(currentLocation);
    };

    // Derived values
    const cityTimezone = currentWeather?.timezone ?? 19800;
    const sunriseTime = currentWeather?.sys?.sunrise ? formatLocalTime(currentWeather.sys.sunrise, cityTimezone) : '--:--';
    const sunsetTime = currentWeather?.sys?.sunset ? formatLocalTime(currentWeather.sys.sunset, cityTimezone) : '--:--';
    const observationTime = currentWeather?.dt ? formatLocalTime(currentWeather.dt, cityTimezone) : null;
    const currentTemp = currentWeather ? Math.round(currentWeather.main.temp) : 0;
    const feelsLikeTemp = currentWeather ? Math.round(currentWeather.main.feels_like) : 0;
    const humidityVal = currentWeather?.main?.humidity ?? 0;
    const windSpeedVal = currentWeather?.wind?.speed ? Math.round(currentWeather.wind.speed * 10) / 10 : 0;
    const windKmH = Math.round(windSpeedVal * 3.6 * 10) / 10;
    const windDeg = currentWeather?.wind?.deg;
    const windCompass = getWindDirection(windDeg);
    const windGustVal = currentWeather?.wind?.gust ? Math.round(currentWeather.wind.gust * 10) / 10 : null;
    const pressureVal = currentWeather?.main?.pressure ?? 1013;
    const visibilityKm = currentWeather?.visibility ? (currentWeather.visibility / 1000).toFixed(1) : null;
    const cloudCoverVal = currentWeather?.clouds?.all ?? 0;
    const dewPointVal = currentWeather ? calculateDewPoint(currentWeather.main.temp, currentWeather.main.humidity) : null;
    const isRaining = (currentWeather?.weather?.[0]?.main || '').toLowerCase().includes('rain');

    if (loading && !currentWeather) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Fetching Real-Time Agro-Weather...</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Connecting to weather stations for {currentLocation.displayName}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            
            {/* Top Navigation & Location Header */}
            <div className="space-y-3">
                <PageHeader
                    title="Agri Weather"
                    subtitle="Microclimate observations & agricultural field recommendations"
                />

                {/* Location Selector Bar (Sections 2, 3, 4) */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 transition-all">
                    
                    {/* Location Badge & Display */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className={`p-2.5 rounded-xl flex items-center justify-center ${currentLocation.isFarmLocation ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'}`}>
                            {currentLocation.isFarmLocation ? <Home className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    {currentLocation.name || currentWeather?.name}
                                    {(currentLocation.country || currentWeather?.sys?.country) && (
                                        <span className="text-xs font-semibold text-slate-500 uppercase px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">
                                            {currentLocation.country || currentWeather?.sys?.country}
                                        </span>
                                    )}
                                </span>

                                {/* Visual Distinction: Farm vs Selected Location */}
                                {currentLocation.isFarmLocation ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                                        <Sparkles className="w-3 h-3 text-emerald-600" /> My Farm Location
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                                        Selected Location
                                    </span>
                                )}
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {currentLocation.displayName}
                            </p>
                        </div>
                    </div>

                    {/* Actions: Change Location & Reset */}
                    <div className="flex items-center gap-2">
                        {!currentLocation.isFarmLocation && (
                            <button
                                onClick={handleResetToFarmLocation}
                                className="px-3 py-2 text-xs font-bold rounded-xl text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 transition flex items-center gap-1.5 shadow-sm"
                                title="Reset to your saved farm location"
                            >
                                <Home className="w-3.5 h-3.5" /> Reset to My Farm
                            </button>
                        )}

                        <button
                            onClick={() => setSearchOpen(prev => !prev)}
                            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 shadow-sm"
                        >
                            <Search className="w-3.5 h-3.5 text-slate-500" />
                            {searchOpen ? 'Close Search' : 'Change Location'}
                        </button>

                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-2 rounded-xl text-slate-600 hover:text-emerald-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition"
                            title="Refresh observation"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Location Search Dropdown Panel */}
                {searchOpen && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Search className="w-4 h-4 text-emerald-600" /> Search Any Village, Town, City, or District
                            </h4>
                            <button onClick={() => setSearchOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleLocationSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Enter village, mandal, district (e.g. Warangal, Khammam, Nizamabad, Guntur)..."
                                    className="w-full pl-4 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-emerald-500 transition"
                                    autoFocus
                                />
                                {searchQuery && (
                                    <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={searching || !searchQuery.trim()}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-sm transition"
                            >
                                {searching ? 'Searching...' : 'Search'}
                            </button>
                        </form>

                        <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
                            <span className="italic">Note: Searching another location is temporary and will never alter your saved profile.</span>
                            <button
                                onClick={handleUseDeviceLocation}
                                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                            >
                                <Navigation className="w-3.5 h-3.5" /> Use Current Device Location
                            </button>
                        </div>

                        {/* Search Results List */}
                        {searchResults.length > 0 && (
                            <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto pt-2 border-t border-slate-100 dark:border-slate-700">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Select Place:</span>
                                {searchResults.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSelectLocation(item)}
                                        className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-sm flex items-center justify-between transition group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-emerald-600" />
                                            <span>{item.name} {item.state ? <span className="text-xs text-slate-500">({item.state})</span> : ''}</span>
                                        </div>
                                        <span className="text-xs text-slate-400 group-hover:text-emerald-600 flex items-center gap-1 font-semibold">
                                            View Weather <ChevronRight className="w-3.5 h-3.5" />
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Error Message Alert (if weather fetch failed) */}
            {errorMessage && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl p-4 flex items-center justify-between gap-4 text-red-700 dark:text-red-300 text-sm">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
                        <div>
                            <p className="font-bold">Weather Unavailable for this Location</p>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{errorMessage}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleResetToFarmLocation}
                        className="px-3 py-1.5 bg-red-100 dark:bg-red-900 hover:bg-red-200 text-red-800 dark:text-red-200 rounded-lg text-xs font-bold transition whitespace-nowrap"
                    >
                        Reset to Farm
                    </button>
                </div>
            )}

            {/* Main Weather Hero Banner */}
            {currentWeather && (
                <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 rounded-3xl shadow-xl shadow-emerald-900/10 overflow-hidden relative text-white transition-all">
                    <CloudSun className="absolute -right-8 -top-8 w-72 h-72 text-white/10 pointer-events-none" />

                    <div className="p-6 md:p-8 relative z-10">
                        {/* Top Meta Line: Live Indicator, City Name & Observation Timestamp */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                            <div className="flex items-center gap-2">
                                <span className="bg-black/25 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border border-white/10">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Station Live Observation
                                </span>
                                {observationTime && (
                                    <span className="text-xs text-emerald-100/90 font-medium bg-black/20 px-2.5 py-1 rounded-full border border-white/5">
                                        Updated {observationTime}
                                    </span>
                                )}
                            </div>

                            <span className="text-xs font-medium text-emerald-100/80 bg-black/20 px-3 py-1 rounded-full border border-white/5">
                                {currentWeather.coord?.lat?.toFixed(2)}°N, {currentWeather.coord?.lon?.toFixed(2)}°E
                            </span>
                        </div>

                        {/* Main Temperature & Visuals */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-7xl md:text-8xl font-black tracking-tighter drop-shadow-md">
                                        {currentTemp}°
                                    </span>
                                    <span className="text-xl md:text-2xl font-bold text-emerald-200">C</span>
                                </div>
                                <p className="text-2xl font-bold capitalize mt-1 drop-shadow flex items-center gap-2">
                                    {currentWeather.weather?.[0]?.description || 'Clear Sky'}
                                </p>
                                <p className="text-sm text-emerald-100/90 mt-1 font-medium">
                                    Feels like <span className="font-bold text-white">{feelsLikeTemp}°C</span>
                                    {currentWeather.main.temp_min !== currentWeather.main.temp_max && (
                                        <span className="ml-2 text-xs opacity-75">
                                            (Min: {Math.round(currentWeather.main.temp_min)}° • Max: {Math.round(currentWeather.main.temp_max)}°)
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/* Essential Metrics Grid (4 Key Quadrants) */}
                            <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                                <div className="bg-black/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex flex-col justify-between min-w-[130px]">
                                    <span className="text-emerald-100/80 text-xs font-medium flex items-center gap-1.5">
                                        <Droplets className="w-3.5 h-3.5 text-emerald-300" /> Humidity
                                    </span>
                                    <span className="font-extrabold text-xl mt-1">{humidityVal}%</span>
                                    {dewPointVal !== null && (
                                        <span className="text-[10px] text-emerald-200/80 font-medium mt-0.5">Dew Pt: {dewPointVal}°C</span>
                                    )}
                                </div>

                                <div className="bg-black/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex flex-col justify-between min-w-[130px]">
                                    <span className="text-emerald-100/80 text-xs font-medium flex items-center gap-1.5">
                                        <Wind className="w-3.5 h-3.5 text-emerald-300" /> Wind
                                    </span>
                                    <span className="font-extrabold text-xl mt-1">{windSpeedVal} m/s</span>
                                    <span className="text-[10px] text-emerald-200/80 font-medium mt-0.5">{windCompass} ({windKmH} km/h)</span>
                                </div>

                                <div className="bg-black/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex flex-col justify-between min-w-[130px]">
                                    <span className="text-emerald-100/80 text-xs font-medium flex items-center gap-1.5">
                                        <Sunrise className="w-3.5 h-3.5 text-amber-300" /> Sunrise
                                    </span>
                                    <span className="font-extrabold text-xl mt-1">{sunriseTime}</span>
                                    <span className="text-[10px] text-emerald-200/80 font-medium mt-0.5">Local Dawn</span>
                                </div>

                                <div className="bg-black/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex flex-col justify-between min-w-[130px]">
                                    <span className="text-emerald-100/80 text-xs font-medium flex items-center gap-1.5">
                                        <Sunset className="w-3.5 h-3.5 text-orange-300" /> Sunset
                                    </span>
                                    <span className="font-extrabold text-xl mt-1">{sunsetTime}</span>
                                    <span className="text-[10px] text-emerald-200/80 font-medium mt-0.5">Local Dusk</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Intelligent Agricultural Recommendations (Sections 6, 7, 8) */}
            <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-6 bg-emerald-600 rounded-full"></div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            Agri Recommendations & Field Operations
                        </h3>
                    </div>

                    {/* Source Indicator (Gemini vs Rule-based) */}
                    <div className="flex items-center gap-2 text-xs">
                        {recomSource === 'gemini' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                <Sparkles className="w-3.5 h-3.5 text-purple-600" /> AI-Optimized (Gemini)
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Agrometeorological Rules Engine
                            </span>
                        )}
                    </div>
                </div>

                {recomLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-36 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recommendations.map((rec) => {
                            // Semantic Styling: Favorable (Green), Caution (Amber), Unfavorable (Red), Insufficient Data (Neutral)
                            let borderClass = 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20';
                            let badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-300';
                            let IconComponent = CheckCircle;
                            let iconColor = 'text-emerald-600 dark:text-emerald-400';

                            if (rec.status === 'caution') {
                                borderClass = 'border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20';
                                badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-300';
                                IconComponent = AlertTriangle;
                                iconColor = 'text-amber-600 dark:text-amber-400';
                            } else if (rec.status === 'unfavorable') {
                                borderClass = 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20';
                                badgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border-rose-300';
                                IconComponent = XCircle;
                                iconColor = 'text-rose-600 dark:text-rose-400';
                            } else if (rec.status === 'insufficient_data') {
                                borderClass = 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40';
                                badgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-300';
                                IconComponent = HelpCircle;
                                iconColor = 'text-slate-500';
                            }

                            return (
                                <Card
                                    key={rec.id || rec.activity}
                                    className={`p-5 rounded-2xl border ${borderClass} transition-all hover:shadow-md shadow-sm flex flex-col justify-between`}
                                >
                                    <div>
                                        {/* Card Header: Activity Title & Semantic Status Pill */}
                                        <div className="flex items-center justify-between gap-2 mb-2.5">
                                            <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                                                <IconComponent className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
                                                {rec.activity}
                                            </h4>
                                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeClass} uppercase tracking-wider`}>
                                                {rec.statusLabel || rec.status}
                                            </span>
                                        </div>

                                        {/* Actionable Advice */}
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                                            {rec.advice}
                                        </p>

                                        {/* Underlying Reason */}
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">Why:</span> {rec.reason}
                                        </p>
                                    </div>

                                    {/* Footer: Supporting Metrics & Time Window */}
                                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {rec.metrics?.wind && (
                                                <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                                    Wind: {rec.metrics.wind}
                                                </span>
                                            )}
                                            {rec.metrics?.rainChance12h && (
                                                <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-semibold">
                                                    Rain: {rec.metrics.rainChance12h}
                                                </span>
                                            )}
                                            {rec.metrics?.temp && (
                                                <span className="bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                                    Temp: {rec.metrics.temp}
                                                </span>
                                            )}
                                        </div>

                                        {rec.timeWindow && (
                                            <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-slate-400" /> {rec.timeWindow}
                                            </span>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 24-Hour to 48-Hour Hourly Timeline with Next-Day Groups (Section 5) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-600" />
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                            Forecast Timeline (24–48 Hours)
                        </h3>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Local 24-Hour Format</span>
                </div>

                {forecastGroups.length === 0 ? (
                    <Card className="p-8 text-center text-slate-500">No forecast data available.</Card>
                ) : (
                    <div className="space-y-5">
                        {forecastGroups.map((group, groupIdx) => (
                            <div key={group.dateKey} className="space-y-2.5">
                                {/* Visible Day Transition Header (Section 5) */}
                                <div className="flex items-center gap-3">
                                    <div className="px-3.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-white dark:bg-slate-700 shadow-sm flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                                        {group.dayHeader}
                                    </div>
                                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                                </div>

                                {/* Horizontal Scrollable Cards for this day */}
                                <div className="flex overflow-x-auto pb-3 gap-3 hide-scrollbar">
                                    {group.items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex flex-col items-center justify-between p-3.5 min-w-[110px] max-w-[120px] rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all shadow-sm flex-shrink-0"
                                        >
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                {item.time}
                                            </span>

                                            <img
                                                src={`https://openweathermap.org/img/wn/${item.icon}@2x.png`}
                                                alt={item.desc}
                                                className="w-12 h-12 -my-1"
                                                loading="lazy"
                                            />

                                            <span className="text-xl font-black text-slate-900 dark:text-white">
                                                {item.temp}°
                                            </span>

                                            <div className="mt-1 flex flex-col items-center gap-1 text-[11px] w-full pt-1.5 border-t border-slate-100 dark:border-slate-700/60">
                                                <span className={`font-bold flex items-center gap-1 ${item.rainProb > 30 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                                                    <CloudRain className="w-3 h-3" /> {item.rainProb}%
                                                </span>
                                                <span className="text-slate-400 text-[10px] truncate max-w-[90px]" title={item.desc}>
                                                    {item.desc}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Temperature & Precipitation Trend Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6 bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Thermometer className="w-5 h-5 text-emerald-600" /> 24-Hour Temperature & Rain Trend
                        </h3>
                        <div className="flex items-center gap-3 text-xs font-semibold">
                            <span className="flex items-center gap-1 text-emerald-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Temp (°C)</span>
                        </div>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="agroGreenGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#059669" stopOpacity={0.35}/>
                                        <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} dx={-5} domain={['dataMin - 2', 'dataMax + 2']} />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                                                    <p className="font-bold text-slate-300">{data.dateHeader} at {label}</p>
                                                    <p className="text-emerald-400 font-extrabold text-sm">{data.temp}°C</p>
                                                    <p className="text-blue-300">Rain Chance: {data.rain}%</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="temp"
                                    stroke="#059669"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#agroGreenGrad)"
                                    activeDot={{ r: 6, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                                    name="Temp (°C)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Atmospherics & Meteorological Detail Card (Section 1: Replaces Premium Metrics with Useful Supported Metrics) */}
                <Card className="p-6 bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Gauge className="w-5 h-5 text-emerald-600" /> Atmospherics & Air
                            </h3>
                            <span className="text-[11px] font-semibold text-slate-400">Current Plan</span>
                        </div>

                        <div className="space-y-3.5 text-sm">
                            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-700">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                                    <Wind className="w-4 h-4 text-emerald-600" /> Wind Velocity
                                </span>
                                <span className="font-bold text-slate-800 dark:text-white">
                                    {windSpeedVal} m/s ({windKmH} km/h)
                                </span>
                            </div>

                            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-700">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                                    <Compass className="w-4 h-4 text-emerald-600" /> Wind Direction
                                </span>
                                <span className="font-bold text-slate-800 dark:text-white">
                                    {windCompass} {windDeg !== undefined ? `(${windDeg}°)` : ''}
                                </span>
                            </div>

                            {windGustVal !== null && (
                                <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-700">
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                                        <Wind className="w-4 h-4 text-amber-500" /> Wind Gusts
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-white">
                                        {windGustVal} m/s
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-700">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                                    <Droplets className="w-4 h-4 text-emerald-600" /> Dew Point
                                </span>
                                <span className="font-bold text-slate-800 dark:text-white">
                                    {dewPointVal !== null ? `${dewPointVal}°C` : '--'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-700">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                                    <Eye className="w-4 h-4 text-emerald-600" /> Visibility
                                </span>
                                <span className="font-bold text-slate-800 dark:text-white">
                                    {visibilityKm ? `${visibilityKm} km` : 'Standard'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-700">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                                    <Gauge className="w-4 h-4 text-emerald-600" /> Barometric Pressure
                                </span>
                                <span className="font-bold text-slate-800 dark:text-white">
                                    {pressureVal} hPa
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
                                    <CloudSun className="w-4 h-4 text-emerald-600" /> Cloud Coverage
                                </span>
                                <span className="font-bold text-slate-800 dark:text-white">
                                    {cloudCoverVal}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-400">
                        <span>Solar Period: {sunriseTime} – {sunsetTime}</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">OpenWeather Standard</span>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Weather;
