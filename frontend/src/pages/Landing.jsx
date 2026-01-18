import { useNavigate } from "react-router-dom";
import { Sprout, TrendingUp, Tractor, Users, ArrowRight, ShieldCheck, Leaf } from "lucide-react";

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white">

            {/* --- NAVBAR --- */}
            <nav className="flex justify-between items-center px-8 py-5 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="bg-green-600 p-2 rounded-lg">
                        <Leaf className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-gray-800 tracking-tight">AgriSpine</span>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate("/login")}
                        className="text-gray-600 font-semibold hover:text-green-600 transition"
                    >
                        Login
                    </button>
                    <button
                        onClick={() => navigate("/register")}
                        className="bg-green-600 text-white px-5 py-2.5 rounded-full font-bold hover:bg-green-700 transition shadow-lg hover:shadow-green-200"
                    >
                        Join Now
                    </button>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <header className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <div className="inline-block bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide mb-2">
                        🚀 The Future of Farming is Here
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                        Smart Tech for <br />
                        <span className="text-green-600">Modern Farmers</span>
                    </h1>
                    <p className="text-lg text-gray-500 max-w-lg leading-relaxed">
                        Manage your crops, track expenses, rent machinery, and detect plant diseases with AI. All in one app.
                    </p>
                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={() => navigate("/register")}
                            className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-xl hover:shadow-green-200 flex items-center gap-2"
                        >
                            Get Started <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => navigate("/login")}
                            className="bg-white text-gray-700 border border-gray-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition"
                        >
                            Log In
                        </button>
                    </div>
                    <div className="pt-6 flex items-center gap-4 text-sm text-gray-400 font-medium">
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"></div>
                            ))}
                        </div>
                        <p>Trusted by 10,000+ Farmers</p>
                    </div>
                </div>

                {/* Hero Image / Illustration */}
                <div className="relative">
                    <div className="absolute top-0 right-0 w-full h-full bg-green-50 rounded-full blur-3xl opacity-50 -z-10"></div>
                    <img
                        src="https://images.unsplash.com/photo-1625246333195-58f21a408b59?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                        alt="Farming App"
                        className="rounded-3xl shadow-2xl border-4 border-white transform hover:scale-[1.02] transition duration-500"
                    />
                    {/* Floating Badge */}
                    <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 animate-bounce">
                        <div className="bg-green-100 p-3 rounded-full">
                            <ShieldCheck className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Status</p>
                            <p className="text-gray-800 font-bold">Safe & Secure</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- FEATURES SECTION --- */}
            <section className="bg-gray-50 py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900">Everything you need to grow</h2>
                        <p className="text-gray-500 mt-3">Advanced tools simplified for every farmer.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Sprout className="w-8 h-8 text-green-600" />}
                            title="Crop Management"
                            desc="Track sowing dates, expenses, and harvest yields efficiently."
                        />
                        <FeatureCard
                            icon={<TrendingUp className="w-8 h-8 text-blue-600" />}
                            title="Market Rates"
                            desc="Get real-time Mandi prices and sell at the best time."
                        />
                        <FeatureCard
                            icon={<Tractor className="w-8 h-8 text-orange-600" />}
                            title="Rent Machinery"
                            desc="Find tractors, drones, and harvesters nearby instantly."
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="w-8 h-8 text-teal-600" />}
                            title="Plant Doctor"
                            desc="Detect diseases early using our AI-powered scanner."
                        />
                        <FeatureCard
                            icon={<Users className="w-8 h-8 text-purple-600" />}
                            title="Community"
                            desc="Connect with experts and other farmers to solve doubts."
                        />
                        <FeatureCard
                            icon={<Leaf className="w-8 h-8 text-yellow-600" />}
                            title="Govt Schemes"
                            desc="Stay updated with the latest subsidies and financial aid."
                        />
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Leaf className="w-6 h-6 text-green-500" />
                        <span className="text-xl font-bold">AgriSpine</span>
                    </div>
                    <p className="text-gray-400 text-sm">© 2025 AgriSpine Inc. All rights reserved.</p>
                </div>
            </footer>

        </div>
    );
};

// Helper Component for Cards
const FeatureCard = ({ icon, title, desc }) => (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition duration-300">
        <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
        <p className="text-gray-500 leading-relaxed">{desc}</p>
    </div>
);

export default Landing;