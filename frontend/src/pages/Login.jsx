import { useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { Sprout, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";

const Login = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ phone: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data } = await api.post("/auth/login", formData);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || t('auth.login_fail', { defaultValue: "Login failed" }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 py-10 px-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-green-100 p-3 rounded-full mb-3">
            <Sprout className="w-8 h-8 text-green-700" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{t('auth.login_title', { defaultValue: 'AgriSpine Login' })}</h2>
          <p className="text-gray-500 text-sm">{t('auth.welcome_back', { defaultValue: 'Welcome back, Farmer!' })}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.phone', { defaultValue: 'Phone Number' })}</label>
            <input name="phone" type="tel" placeholder="e.g. 9876543210" onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password', { defaultValue: 'Password' })}</label>
            <input name="password" type="password" placeholder="........" onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
          </div>
          <button type="submit" disabled={isLoading} className={`w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition ${isLoading ? "bg-green-400 cursor-not-allowed text-white" : "bg-green-600 hover:bg-green-700 text-white shadow-lg"}`}>
            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> {t('auth.logging_in', { defaultValue: 'Logging in...' })}</> : t('auth.login_btn', { defaultValue: 'Login' })}
          </button>
        </form>

        {error && <div className="mt-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center animate-pulse">{error}</div>}

        <p className="mt-8 text-center text-sm text-gray-500">
          {t('auth.no_account', { defaultValue: "Don't have an account?" })} <span onClick={() => navigate("/register")} className="text-green-600 font-bold cursor-pointer hover:underline">{t('auth.register_here', { defaultValue: 'Register here' })}</span>
        </p>
      </div>
    </div>
  );
};

export default Login;