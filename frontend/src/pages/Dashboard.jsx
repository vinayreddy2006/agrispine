import { useEffect, useState } from "react";
import api from "../utils/api";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Sprout, Tractor, CloudSun, Users, PlusCircle, Trash2, Droplets, Wind, Landmark, TrendingUp, BarChart3, Stethoscope, ShoppingBag, MessageCircle } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState(null);

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
  }, [navigate]);

  const fetchWeather = async (district) => {
    try {
      const API_KEY = "35e669987b8f3f982e649b224ed22c0c";
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${district}&units=metric&appid=${API_KEY}`;
      const response = await axios.get(url);

      setWeather({
        temp: Math.round(response.data.main.temp),
        condition: response.data.weather[0].main,
        humidity: response.data.main.humidity,
        wind: response.data.wind.speed
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

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#16a34a',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        await api.delete(`/crops/delete/${id}`, {
          headers: { "auth-token": token }
        });
        setCrops(crops.filter(crop => crop._id !== id));
        Swal.fire('Deleted!', 'Your crop has been removed.', 'success');
      } catch (err) {
        Swal.fire('Error', 'Could not delete crop', 'error');
      }
    }
  };

  if (!user) return null;

  return (
    <div className="w-full">

      {/* --- UPDATED NAVBAR --- */}
      <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-green-100 p-2 rounded-lg">
            <Sprout className="w-6 h-6 text-green-700" />
          </div>
          <span className="text-xl font-bold text-gray-800">AgriSpine</span>
        </div>

        <div className="flex items-center gap-4">

          {/* 👇 THIS IS THE CLICKABLE PROFILE BUTTON NOW 👇 */}
          <div
            onClick={() => navigate("/profile")}
            className="hidden md:flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full cursor-pointer hover:bg-green-100 hover:text-green-700 transition border border-transparent hover:border-green-200"
            title="Edit Profile"
          >
            {/* Check if user has a profile image */}
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt="Profile"
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <User className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{user.name}</span>
          </div>
          {/* ----------------------------------------------- */}

          <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition" title="Logout">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 space-y-8">

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl p-8 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Namaste, {user.name}! 🙏</h1>
          <p className="opacity-90">Location: <span className="font-semibold">{user.district || "Hyderabad"}</span></p>
        </div>

        {/* Crops Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Sprout className="text-green-600" /> My Crops
            </h2>
            <button onClick={() => navigate("/add-crop")} className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm">
              <PlusCircle className="w-4 h-4" /> Add Crop
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading crops...</p>
          ) : crops.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 text-center">
              <p className="text-gray-500 mb-4">You haven't added any crops yet.</p>
              <button onClick={() => navigate("/add-crop")} className="text-green-600 font-semibold hover:underline">Add your first crop now</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {crops.map((crop) => (
                <div key={crop._id} 
                  onClick={() => navigate(`/crop/${crop._id}`)}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <Sprout className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{crop.cropName}</h3>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${crop.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {crop.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(crop._id); }} className="text-gray-400 hover:text-red-500 transition p-1" title="Delete Crop">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-gray-500 text-sm mt-2 space-y-1">
                    <p>📏 Area: <span className="font-medium text-gray-700">{crop.area} Acres</span></p>
                    <p>📅 Sown: <span className="font-medium text-gray-700">{new Date(crop.sowingDate).toLocaleDateString()}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Weather */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Tractor className="text-blue-600" /> Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Reports Card */}
            <div
              onClick={() => navigate("/reports")}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-purple-100 p-2 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-700">Analytics</h3>
              </div>
              <p className="text-sm text-gray-500">Track profits & costs</p>
            </div>

            {/* Weather Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-orange-100 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition"></div>
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                  <CloudSun className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-700">Weather</h3>
              </div>
              {weather ? (
                <div className="relative z-10">
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-bold text-gray-800">{weather.temp}{weather.temp !== "--" && "°C"}</span>
                    <span className="text-sm text-gray-500 mb-1 font-medium">{weather.condition}</span>
                  </div>
                  {weather.temp !== "--" && (
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> {weather.humidity}% Hum</span>
                      <span className="flex items-center gap-1"><Wind className="w-3 h-3" /> {weather.wind} m/s</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="animate-pulse flex space-x-4">
                  <div className="h-10 w-20 bg-gray-200 rounded"></div>
                </div>
              )}
            </div>

            {/* Village Chat Card */}
            <div
              onClick={() => navigate("/village-chat")}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 p-2 rounded-lg text-green-600 group-hover:bg-green-600 group-hover:text-white transition">
                  <MessageCircle className="w-6 h-6" /> {/* Import MessageCircle from lucide-react */}
                </div>
                <h3 className="font-bold text-gray-700">Village Talk</h3>
              </div>
              <p className="text-sm text-gray-500">Live chat with your neighbors</p>
            </div>

            {/* Buyer Market Card */}
            <div
              onClick={() => navigate("/buyer-market")}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-700">Buyer Market</h3>
              </div>
              <p className="text-sm text-gray-500">Buy crops directly from farmers</p>
            </div>

            {/* Market Prices Card */}
            <div
              onClick={() => navigate("/market")}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 p-2 rounded-lg text-green-600 group-hover:bg-green-600 group-hover:text-white transition">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-700">Mandi Rates</h3>
              </div>
              <p className="text-sm text-gray-500">Check daily market prices</p>
            </div>

            {/* Plant Doctor Card */}
            <div
              onClick={() => navigate("/doctor")}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-teal-100 p-2 rounded-lg text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition">
                  <Sprout className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-700">Plant Doctor</h3>
              </div>
              <p className="text-sm text-gray-500">Detect crop diseases via AI</p>
            </div>

            {/* Machinery Card */}
            <div
              onClick={() => navigate("/rent-machinery")}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                  <Tractor className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-700">Rent Machinery</h3>
              </div>
              <p className="text-sm text-gray-500">Find tractors & harvesters nearby</p>
            </div>

            {/* Community Card */}
            <div
              onClick={() => navigate("/community")}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-purple-100 p-2 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-700">Community</h3>
              </div>
              <p className="text-sm text-gray-500">Ask questions & help others</p>
            </div>

            {/* Government Schemes Card */}
            <div
              onClick={() => navigate("/schemes")}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition">
                  <Landmark className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-700">Govt Schemes</h3>
              </div>
              <p className="text-sm text-gray-500">Subsidies & financial aid</p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;