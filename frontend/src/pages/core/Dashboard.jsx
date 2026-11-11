import { useEffect, useState } from "react";
import api from "../../utils/api";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { 
  LogOut, User, Sprout, Tractor, CloudSun, Users, PlusCircle, 
  Trash2, Droplets, Wind, Landmark, TrendingUp, BarChart3, 
  ShoppingBag, MessageCircle, MapPin, CheckCircle2, ChevronRight, X 
} from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { translateText } from "../../utils/translateHelper";
import PageHeader from "../../components/common/PageHeader";
import QuickActions from "../../components/dashboard/QuickActions";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import LoadingState from "../../components/ui/LoadingState";
import ErrorState from "../../components/ui/ErrorState";
import { CardSkeleton } from "../../components/ui/LoadingSkeleton";
import LocationConfirmationModal from "../../components/common/LocationConfirmationModal";

const API_KEY = "35e669987b8f3f982e649b224ed22c0c";

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cropsError, setCropsError] = useState(null);
  const [translatedName, setTranslatedName] = useState("");

  // Weather state
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);

  // Location Confirmation Modal & Non-Intrusive Reminder
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showLocationBanner, setShowLocationBanner] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) {
        navigate("/");
        return;
      }

      let parsedUser = {};
      try {
        parsedUser = JSON.parse(userData);
      } catch (e) {
        navigate("/");
        return;
      }

      setUser(parsedUser);

      // Check if location confirmation is needed and not skipped for this session
      const hasSkipped = sessionStorage.getItem("agrispine_skip_location_prompt") === "true";
      if (!parsedUser.isLocationConfirmed && !hasSkipped) {
        setShowLocationBanner(true);
      }

      // Dynamic Translation for Name
      const name = await translateText(parsedUser.name, i18n.language);
      setTranslatedName(name);

      // 1. Fetch Crops
      loadCrops(token);

      // 2. Fetch Weather using accurate multi-tier location resolution
      fetchWeather(parsedUser);
    };

    fetchData();

    // Listen to real-time location confirmation events
    const onLocationConfirmed = (e) => {
      const updated = e.detail;
      if (updated) {
        setUser(updated);
        setShowLocationBanner(false);
        fetchWeather(updated);
      }
    };
    window.addEventListener("agrispine_location_confirmed", onLocationConfirmed);

    return () => {
      window.removeEventListener("agrispine_location_confirmed", onLocationConfirmed);
    };
  }, [navigate, i18n.language]);

  const loadCrops = async (authToken) => {
    const token = authToken || localStorage.getItem("token");
    setLoading(true);
    setCropsError(null);
    try {
      const { data } = await api.get("/crops/fetchall", {
        headers: { "auth-token": token }
      });
      setCrops(data);
    } catch (err) {
      console.error("Failed to fetch crops", err);
      setCropsError("Unable to retrieve your active crops right now. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Robust location resolution & weather fetcher (matches Weather page accuracy)
  const fetchWeather = async (targetUser) => {
    if (!targetUser) return;
    setWeatherLoading(true);
    setWeatherError(null);

    try {
      let lat = null;
      let lon = null;
      let locationLabel = [targetUser.village, targetUser.mandal, targetUser.district]
        .filter(Boolean)
        .join(", ") || targetUser.district || "Hyderabad";

      // 1. Direct coordinates check
      if (targetUser.locationCoordinates?.lat && targetUser.locationCoordinates?.lng) {
        lat = Number(targetUser.locationCoordinates.lat);
        lon = Number(targetUser.locationCoordinates.lng);
      } else if (targetUser.lat && targetUser.lon) {
        lat = Number(targetUser.lat);
        lon = Number(targetUser.lon);
      }

      let res = null;

      // 2. If coordinates available, fetch weather directly by coordinates (most accurate!)
      if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
        try {
          res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
        } catch (e) {
          console.warn("Coordinate weather fetch failed:", e.message);
        }
      }

      // 3. If no coords or failed, try geocoding village with district and state
      if (!res && targetUser.village) {
        const queries = [
          [targetUser.village, targetUser.district, targetUser.state, "IN"].filter(Boolean).join(", "),
          [targetUser.village, targetUser.district, "IN"].filter(Boolean).join(", "),
          [targetUser.village, "IN"].filter(Boolean).join(", ")
        ];

        for (const q of queries) {
          try {
            const geoRes = await axios.get(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${API_KEY}`);
            if (geoRes.data && geoRes.data.length > 0) {
              const item = geoRes.data[0];
              res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${item.lat}&lon=${item.lon}&units=metric&appid=${API_KEY}`);
              if (res) break;
            }
          } catch (e) {}
        }
      }

      // 4. Fallback to district name (districts like Suryapet, Warangal, Nalgonda always resolve in OWM)
      if (!res && targetUser.district) {
        try {
          res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(targetUser.district)}&units=metric&appid=${API_KEY}`);
        } catch (e) {
          console.warn("District weather fetch failed:", e.message);
        }
      }

      // 5. Ultimate fallback to Hyderabad
      if (!res) {
        res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Hyderabad&units=metric&appid=${API_KEY}`);
        if (!locationLabel) locationLabel = "Hyderabad, Telangana";
      }

      if (res && res.data && res.data.main) {
        setWeather({
          temp: Math.round(res.data.main.temp),
          condition: res.data.weather?.[0]?.main || "Clear",
          humidity: res.data.main.humidity,
          wind: res.data.wind?.speed || 0,
          temp_min: Math.round(res.data.main.temp_min),
          temp_max: Math.round(res.data.main.temp_max),
          locationName: locationLabel,
          isLocationConfirmed: !!targetUser.isLocationConfirmed,
          status: 'success'
        });
      } else {
        throw new Error("Invalid weather data format received");
      }

    } catch (err) {
      console.error("Dashboard weather fetch failed:", err);
      setWeather({
        status: 'error',
        errorMessage: 'Unable to retrieve weather. Please verify internet connection or location.',
        isLocationConfirmed: !!targetUser.isLocationConfirmed
      });
      setWeatherError("Weather data currently unavailable");
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleSkipLocation = () => {
    sessionStorage.setItem("agrispine_skip_location_prompt", "true");
    setShowLocationBanner(false);
  };

  const handleLocationConfirmed = (updatedUser) => {
    setUser(updatedUser);
    setShowLocationBanner(false);
    fetchWeather(updatedUser);
  };

  const handleLogout = () => {
    const savedLng = localStorage.getItem("i18nextLng");
    localStorage.clear();
    sessionStorage.clear();
    if (savedLng) localStorage.setItem("i18nextLng", savedLng);
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="w-full">
      <PageHeader 
        title={t('common.agrispine', 'AgriSpine')}
        icon={Sprout}
        showBack={false}
        rightActions={
          <>
            <LanguageSwitcher />
            <div
              onClick={() => navigate("/profile")}
              className="hidden md:flex items-center gap-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-400 transition border border-transparent hover:border-green-200 dark:hover:border-green-800"
            >
              {user.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
              <span className="text-sm font-bold">{translatedName || user.name}</span>
            </div>

            <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition min-h-[44px] min-w-[44px] flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </button>
          </>
        }
      />

      <main className="w-full p-4 md:p-6 space-y-6">
        
        {/* Non-intrusive Location Confirmation Reminder Banner */}
        {showLocationBanner && (
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-sm flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{t('location_modal.title', 'Confirm Your Farm Location')}</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    {t('common.recommended', 'Recommended')}
                  </span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {t('location_modal.desc', 'Confirming your village enables hyper-local weather alerts, spray advisories, and nearby machinery rental recommendations.')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleSkipLocation}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 transition"
              >
                {t('common.skip', 'Skip for Now')}
              </button>
              <button
                onClick={() => setShowLocationModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('location_modal.confirm_btn', 'Confirm Location')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl p-8 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">{t('dashboard.welcome')}, {translatedName || user.name}! 🙏</h1>
          <p className="opacity-90 flex items-center gap-1.5 flex-wrap">
            <MapPin className="w-4 h-4 text-emerald-200" />
            <span>{t('dashboard.location')}: </span>
            <span className="font-semibold">
              {[user.village, user.mandal, user.district].filter(Boolean).join(", ") || user.district || "Hyderabad"}
            </span>
            {user.isLocationConfirmed ? (
              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold ml-1">
                {t('common.verified_farm', 'Verified Farm')}
              </span>
            ) : (
              <button 
                onClick={() => setShowLocationModal(true)} 
                className="text-[11px] underline text-emerald-200 hover:text-white ml-2 font-bold cursor-pointer"
              >
                {t('location_modal.confirm_btn', 'Confirm Now')}
              </button>
            )}
          </p>
        </div>

        {/* Active Crops Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Sprout className="text-green-600" /> {t('dashboard.my_crops', 'Active Crops')}
            </h2>
            <Button onClick={() => navigate("/add-crop")} variant="primary" icon={PlusCircle}>
              {t('dashboard.add_crop')}
            </Button>
          </div>

          {loading ? (
            <CardSkeleton count={2} />
          ) : cropsError ? (
            <ErrorState
              title={t('ui.error_title', 'Unable to load crops')}
              message={cropsError}
              onRetry={() => loadCrops()}
              showHome={false}
            />
          ) : crops.filter(c => c.status === 'active').length === 0 ? (
            <EmptyState 
              title={t('dashboard.no_crops')}
              description={t('dashboard.add_first_crop')}
              tip={t('dashboard_extra.add_crop_prompt', 'Recording your crops unlocks AI pest diagnostics, mandi rate alerts, and machinery scheduling tailored to your farm.')}
              icon={Sprout}
              actionText={t('dashboard.add_crop', 'Add Crop')}
              onAction={() => navigate("/add-crop")}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {crops.filter(c => c.status === 'active').map((crop) => (
                <Card 
                  key={crop._id}
                  hover
                  onClick={() => navigate(`/crop/${crop._id}`)}
                  className="p-5"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-3 rounded-xl">
                        <Sprout className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-text-primary">{t(`crops_list.${crop.cropName.toLowerCase()}`, { defaultValue: crop.cropName })}</h3>
                        <span className="text-xs font-bold px-2 py-1 rounded-md bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300">
                          {t('common.active', 'ACTIVE')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-text-secondary text-sm mt-3 space-y-2 bg-background p-3 rounded-lg border border-border">
                    <p className="flex justify-between"><span>📏 {t('dashboard.area')}</span> <span className="font-bold text-text-primary">{crop.area} {t('crop.acres', 'Acres')}</span></p>
                    <p className="flex justify-between"><span>📅 {t('dashboard.sown')}</span> <span className="font-bold text-text-primary">{new Date(crop.sowingDate).toLocaleDateString()}</span></p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Weather Grid */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Tractor className="text-blue-600" /> {t('dashboard.quick')}
          </h2>
          <QuickActions 
            weather={weather} 
            weatherLoading={weatherLoading} 
            weatherError={weatherError} 
            onConfirmLocation={() => setShowLocationModal(true)} 
            onRetryWeather={() => fetchWeather(user)} 
          />
        </div>
      </main>

      {/* Location Confirmation Modal */}
      <LocationConfirmationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationConfirmed={handleLocationConfirmed}
        initialData={user}
      />

    </div>
  );
};

export default Dashboard;
