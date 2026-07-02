import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import Swal from "sweetalert2";
import { ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import ThemeToggle from "../../components/ThemeToggle";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/admin/login", { email, password });
      localStorage.setItem("admin-token", data.token);
      localStorage.setItem("admin-user", JSON.stringify(data.admin));
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Login Successful', showConfirmButton: false, timer: 1500 });
      navigate("/dashboard");
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200 flex flex-col">
        <header className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto w-full">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors font-medium">
                <ArrowLeft className="w-5 h-5" /> Back to Home
            </button>
            <ThemeToggle />
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-primary-light text-primary rounded-full flex items-center justify-center mb-4">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Login</h2>
                    <p className="text-gray-500 text-sm mt-1">Sign in to your dashboard</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
                        <input 
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="admin@agrispine.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                        <input 
                            type="password"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2 mt-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        Need an admin account?{" "}
                        <button onClick={() => navigate("/register")} className="text-primary font-bold hover:underline">
                            Register here
                        </button>
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdminLogin;
