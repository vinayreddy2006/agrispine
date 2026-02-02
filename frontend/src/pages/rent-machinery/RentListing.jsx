import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { ArrowLeft, MapPin, User, Filter } from "lucide-react";
import { useTranslation } from "react-i18next"; // 1. Import Hook

const RentListing = () => {
    const { t } = useTranslation(); // 2. Initialize Hook
    const { type } = useParams();
    const navigate = useNavigate();
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMachines = async () => {
            try {
                const token = localStorage.getItem("token");
                const { data } = await api.get(`/machines/type/${type}`, {
                    headers: { "auth-token": token }
                });
                setMachines(data);
            } catch (err) {
                console.error("Failed to fetch", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMachines();
    }, [type]);

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header */}
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">
                            {/* Translated: "Available Tractors" */}
                            {t('rent.avail')} {t(`machines.${type.toLowerCase().replace(" ", "_")}`, { defaultValue: type })}
                        </h1>
                        <p className="text-xs text-gray-500">{machines.length} {t('rent.providers_found', { defaultValue: 'providers found' })}</p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="max-w-5xl mx-auto p-6 space-y-6">
                {loading ? (
                    <div className="text-center mt-20 text-gray-500">Loading...</div>
                ) : machines.length === 0 ? (
                    <div className="text-center mt-20 bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
                        <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        {/* Translated: "No Tractors found" */}
                        <h3 className="text-lg font-bold text-gray-700">
                            {t('rent.no_found', { type: t(`machines.${type.toLowerCase().replace(" ", "_")}`, { defaultValue: type }) })}
                        </h3>
                        <p className="text-gray-500">Try checking back later.</p>
                    </div>
                ) : (
                    machines.map((machine) => (
                        <div
                            key={machine._id}
                            onClick={() => navigate(`/rent/details/${machine._id}`, { state: { machine } })}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row items-center gap-6 cursor-pointer hover:border-green-400 hover:shadow-lg transition-all group"
                        >
                            {/* --- BIGGER IMAGE CONTAINER (Provider Profile) --- */}
                            <div className="shrink-0 relative">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-50 shadow-inner group-hover:border-green-100 transition-colors bg-gray-100 flex items-center justify-center">

                                    {machine.user?.profileImage ? (
                                        <img
                                            src={machine.user.profileImage}
                                            alt={machine.user.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}

                                    {/* Fallback Icon */}
                                    <div
                                        className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400"
                                        style={{ display: machine.user?.profileImage ? 'none' : 'flex' }}
                                    >
                                        <User className="w-12 h-12" />
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 text-center md:text-left w-full">
                                <h3 className="font-bold text-gray-800 text-2xl group-hover:text-green-700 transition-colors">
                                    {machine.name}
                                </h3>
                                <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-2 justify-center md:justify-start">
                                    <p className="text-sm text-gray-600 flex items-center justify-center md:justify-start gap-1 font-medium">
                                        <User className="w-4 h-4 text-gray-400" /> {machine.user?.name || "Provider"}
                                    </p>
                                    <p className="text-sm text-gray-500 flex items-center justify-center md:justify-start gap-1">
                                        <MapPin className="w-4 h-4 text-gray-400" /> {machine.user?.village || "Location Hidden"}
                                    </p>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="text-center md:text-right shrink-0 bg-gray-50 p-4 rounded-xl min-w-[140px]">
                                <span className="block font-bold text-green-700 text-3xl">₹{machine.price}</span>
                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                                    {/* Dynamic Unit Translation */}
                                    {machine.priceUnit === 'hour' ? t('rent.per_hr') :
                                        machine.priceUnit === 'acre' ? t('rent.per_acre') :
                                            t('rent.per_day')}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RentListing;