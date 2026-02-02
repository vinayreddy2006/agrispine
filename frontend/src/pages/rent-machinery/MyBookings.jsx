import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { ArrowLeft, Calendar, User, Filter } from "lucide-react";
import { useTranslation } from "react-i18next"; // 1. Import Hook

const MyBookings = () => {
    const { t } = useTranslation(); // 2. Initialize Hook
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => {
        const fetchBookings = async () => {
            const token = localStorage.getItem("token");
            const userStr = localStorage.getItem("user");

            if (!userStr) return setLoading(false);

            const userObj = JSON.parse(userStr);
            const userId = userObj._id || userObj.id;

            try {
                const { data } = await api.get("/bookings/fetchall", { headers: { "auth-token": token } });

                const myRequests = data.filter(b => {
                    const farmerId = b.farmer?._id || b.farmer;
                    return String(farmerId) === String(userId);
                });

                setBookings(myRequests);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    // Filter based on Tabs
    const filteredBookings = bookings.filter(b => {
        if (activeTab === "all") return true;
        if (activeTab === "history") return ["rejected", "completed"].includes(b.status);
        return b.status === activeTab;
    });

    const getStatusColor = (status) => {
        if (status === 'confirmed') return "text-green-600 bg-green-50 border-green-200";
        if (status === 'rejected') return "text-red-600 bg-red-50 border-red-200";
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10 border-b border-gray-100">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <button onClick={() => navigate("/rent-machinery")} className="p-2 hover:bg-gray-100 rounded-full transition">
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    {/* Translated "My Requests" */}
                    <h1 className="text-xl font-bold text-gray-800">{t('rent.my_req')}</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 space-y-4">
                {/* Tabs */}
                <div className="flex bg-white p-1 rounded-xl shadow-sm mb-4 overflow-x-auto">
                    {["all", "pending", "confirmed", "history"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold capitalize transition whitespace-nowrap
                            ${activeTab === tab ? "bg-black text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}
                        >
                            {/* Reusing manage keys for consistency: pending, confirmed, history. 'all' defaults to English if missing */}
                            {t(`manage.${tab}`, { defaultValue: tab })}
                        </button>
                    ))}
                </div>

                {loading ? <p className="text-center mt-10">Loading...</p> : filteredBookings.length === 0 ? (
                    <div className="text-center mt-20 text-gray-500">
                        <Filter className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p>No {activeTab} requests found.</p>
                    </div>
                ) : (
                    filteredBookings.map(b => (
                        <div key={b._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                            <img
                                src={b.machine?.image || "https://via.placeholder.com/150"}
                                className="w-20 h-20 rounded-lg object-cover bg-gray-200"
                                alt="Machine"
                            />
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-800">{b.machine?.name}</h3>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${getStatusColor(b.status)}`}>
                                        {b.status}
                                    </span>
                                </div>
                                {/* Translated "Provider" */}
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <User className="w-3 h-3" /> {t('rent.verified')}: {b.provider?.name || "Unknown"}
                                </p>
                                <div className="flex items-center gap-1 text-xs font-bold text-gray-700 mt-2">
                                    <Calendar className="w-3 h-3" /> {new Date(b.date).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MyBookings;