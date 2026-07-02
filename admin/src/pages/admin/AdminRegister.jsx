import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import ThemeToggle from "../../components/ThemeToggle";

const AdminRegister = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            return setError("Passwords do not match");
        }

        setLoading(true);
        try {
            const res = await fetch("http://localhost:5000/api/admin/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password
                })
            });
            const data = await res.json();
            
            if (res.ok) {
                // Navigate to login after successful registration
                navigate("/login", { state: { message: "Registration successful. Please log in." }});
            } else {
                setError(data.message || "Registration failed");
            }
        } catch (err) {
            setError("Server connection failed");
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
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Registration</h2>
                        <p className="text-gray-500 text-sm mt-1">Create a new superadmin account</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                            <input 
                                type="text"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                            <input 
                                type="email"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="admin@agrispine.com"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                            <input 
                                type="password"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                            <input 
                                type="password"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Admin Account"}
                        </button>
                    </form>
                    
                    <div className="mt-8 text-center">
                        <p className="text-gray-500 text-sm">
                            Already have an admin account?{" "}
                            <button onClick={() => navigate("/login")} className="text-primary font-bold hover:underline">
                                Login here
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminRegister;
