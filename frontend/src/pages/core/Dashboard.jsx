import { useEffect, useState } from "react";
import api from "../../utils/api";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Sprout, Tractor, CloudSun, Users, PlusCircle, Trash2, Droplets, Wind, Landmark, TrendingUp, BarChart3, ShoppingBag, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { translateText } from "../../utils/translateHelper"; // New helper
import PageHeader from "../../components/common/PageHeader";
import QuickActions from "../../components/dashboard/QuickActions";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import LoadingState from "../../components/ui/LoadingState";

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState(null);
  const [translatedName, setTranslatedName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) {
        navigate("/");
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Dynamic Translation for Name
      const name = await translateText(parsedUser.name, i18n.language);
      setTranslatedName(name);

      // 1. Fetch Crops
      try {
        const { data } = await api.get("/crops/fetchall", {
          headers: { "auth-token": token }
        });
        setCrops(data);
      } catch (err) {
        console.error("Failed to fetch crops", err);
      } finally {
        setLoading(false);
      }

      // 2. Fetch Weather
      const district = parsedUser.district || "Hyderabad";
      fetchWeather(district);
    };

    fetchData();
  }, [navigate, i18n.language]);

  const fetchWeather = async (district) => {
    try {
      const API_KEY = "35e669987b8f3f982e649b224ed22c0c";
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${district}&units=metric&appid=${API_KEY}`;
      const response = await axios.get(url);

      setWeather({
        temp: Math.round(response.data.main.temp),
        condition: response.data.weather[0].main,
        humidity: response.data.main.humidity,
        wind: response.data.wind.speed,
        temp_min: Math.round(response.data.main.temp_min),
        temp_max: Math.round(response.data.main.temp_max)
      });

    } catch (error) {
      console.error("Weather Error:", error);
      setWeather({ temp: "--", condition: "Key Inactive" });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };



  if (!user) return null;

  return (
    <div className="w-full">
      <PageHeader 
        title="AgriSpine"
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

      <main className="w-full p-4 md:p-6 space-y-8">
        <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl p-8 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">{t('dashboard.welcome')}, {translatedName || user.name}! 🙏</h1>
          <p className="opacity-90">{t('dashboard.location')}: <span className="font-semibold">{user.district || "Hyderabad"}</span></p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Sprout className="text-green-600" /> Active Crops
            </h2>
            <Button onClick={() => navigate("/add-crop")} variant="primary" icon={PlusCircle}>
              {t('dashboard.add_crop')}
            </Button>
          </div>

          {loading ? (
            <LoadingState message="Loading crops..." />
          ) : crops.filter(c => c.status === 'active').length === 0 ? (
            <EmptyState 
              title={t('dashboard.no_crops')}
              description={t('dashboard.add_first_crop')}
              icon={Sprout}
              actionText="Add Crop"
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
                        <span className="text-xs font-bold px-2 py-1 rounded-md bg-green-100 text-green-700">
                          ACTIVE
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-text-secondary text-sm mt-3 space-y-2 bg-background p-3 rounded-lg border border-border">
                    <p className="flex justify-between"><span>📏 {t('dashboard.area')}</span> <span className="font-bold text-text-primary">{crop.area} Acres</span></p>
                    <p className="flex justify-between"><span>📅 {t('dashboard.sown')}</span> <span className="font-bold text-text-primary">{new Date(crop.sowingDate).toLocaleDateString()}</span></p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Crop History Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="text-gray-500" /> Crop History
            </h2>
          </div>

          {loading ? (
            <LoadingState message="Loading history..." />
          ) : crops.filter(c => c.status === 'sold').length === 0 ? (
            <EmptyState 
              title="No Past Crops"
              description="Your completed and sold crops will appear here."
              icon={TrendingUp}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {crops.filter(c => c.status === 'sold').map((crop) => {
                  const totalCost = crop.expenses?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
                  const profit = (crop.revenue || 0) - totalCost;
                  const isProfit = profit >= 0;

                  return (
                    <Card 
                      key={crop._id}
                      hover
                      onClick={() => navigate(`/crop/${crop._id}`)}
                      className="p-5"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl ${isProfit ? 'bg-emerald-100' : 'bg-red-100'}`}>
                            <Landmark className={`w-7 h-7 ${isProfit ? 'text-emerald-600' : 'text-red-600'}`} />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-text-primary">{t(`crops_list.${crop.cropName.toLowerCase()}`, { defaultValue: crop.cropName })}</h3>
                            <span className="text-xs font-bold px-2 py-1 rounded-md bg-gray-100 text-gray-600">
                              SOLD
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-text-secondary text-sm mt-3 space-y-2 bg-background p-3 rounded-lg border border-border">
                        <p className="flex justify-between"><span>Yield:</span> <span className="font-bold text-text-primary">{crop.yieldQty} Qtl</span></p>
                        <p className="flex justify-between">
                            <span>{isProfit ? 'Profit' : 'Loss'}:</span> 
                            <span className={`font-bold ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>
                                {isProfit ? "+" : "-"}₹{Math.abs(profit).toLocaleString('en-IN')}
                            </span>
                        </p>
                      </div>
                    </Card>
                  )
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Tractor className="text-blue-600" /> {t('dashboard.quick')}
          </h2>
          <QuickActions weather={weather} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
