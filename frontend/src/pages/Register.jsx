import { useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { Sprout, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";

const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: "", phone: "", password: "", confirmPassword: "", userType: "farmer", village: "", district: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("❌ " + t('auth.password_mismatch', { defaultValue: "Passwords do not match!" }));
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const { confirmPassword, ...dataToSend } = formData;
      await api.post("/auth/register", dataToSend);
      alert(t('auth.register_title') + " Success!");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || t('auth.register_fail', { defaultValue: "Registration failed." }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-10 px-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-green-100 p-3 rounded-full mb-3">
            <Sprout className="w-8 h-8 text-green-700" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{t('auth.register_title', { defaultValue: 'Create Account' })}</h2>
          <p className="text-gray-500 text-sm">{t('auth.join_community', { defaultValue: 'Join the AgriSpine community' })}</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.fullname', { defaultValue: 'Full Name' })}</label>
            <input name="name" type="text" onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.phone', { defaultValue: 'Phone Number' })}</label>
            <input name="phone" type="tel" onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password', { defaultValue: 'Password' })}</label>
              <input name="password" type="password" onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.confirm_pass', { defaultValue: 'Confirm Password' })}</label>
              <input name="confirmPassword" type="password" onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.iam', { defaultValue: 'I am a...' })}</label>
            <select name="userType" onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 outline-none">
              <option value="farmer">{t('auth.farmer', { defaultValue: 'Farmer' })}</option>
              <option value="provider">{t('auth.provider', { defaultValue: 'Service Provider' })}</option>
              <option value="buyer">{t('auth.buyer', { defaultValue: 'Buyer' })}</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.village', { defaultValue: 'Village' })}</label>
              <input name="village" type="text" onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.district', { defaultValue: 'District' })}</label>
              <input name="district" type="text" onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className={`w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition ${isLoading ? "bg-green-400 cursor-not-allowed text-white" : "bg-green-600 hover:bg-green-700 text-white shadow-lg"}`}>
            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> {t('auth.creating', { defaultValue: 'Creating Account...' })}</> : t('auth.register_btn', { defaultValue: 'Register' })}
          </button>
        </form>

        {error && <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center animate-pulse">{error}</div>}

        <p className="mt-6 text-center text-sm text-gray-500">
          {t('auth.have_account', { defaultValue: 'Already have an account?' })} <span onClick={() => navigate("/login")} className="text-green-600 font-bold cursor-pointer hover:underline">{t('auth.login_here', { defaultValue: 'Login here' })}</span>
        </p>
      </div>
    </div>
  );
};

export default Register;