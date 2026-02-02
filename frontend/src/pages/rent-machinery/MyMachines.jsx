import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { ArrowLeft, Tractor, ChevronRight, Plus } from "lucide-react";
import { useTranslation } from "react-i18next"; // 1. Import

const MyMachines = () => {
    const { t } = useTranslation(); // 2. Hook
    const navigate = useNavigate();
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyMachines = async () => {
            try {
                const token = localStorage.getItem("token");
                const { data } = await api.get("/machines/own", { headers: { "auth-token": token } });
                setMachines(data);
            } catch (err) {
                console.error("Fetch error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMyMachines();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10 border-b border-gray-100">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate("/rent-machinery")} className="p-2 hover:bg-gray-100 rounded-full transition">
                            <ArrowLeft className="w-6 h-6 text-gray-700" />
                        </button>
                        {/* Translated Title */}
                        <h1 className="text-xl font-bold text-gray-800">{t('rent.my_machines')}</h1>
                    </div>
                    <button onClick={() => navigate("/add-machine")} className="bg-green-600 text-white p-2 rounded-full shadow-md">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center mt-10 text-gray-400">Loading inventory...</div>
                ) : machines.length === 0 ? (
                    <div className="text-center mt-20 p-8 flex flex-col items-center">
                        <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mb-4">
                            <Tractor className="w-12 h-12 text-gray-300" />
                        </div>
                        {/* Translated Empty State */}
                        <h3 className="text-lg font-bold text-gray-700">{t('rent.no_found', { type: t('machines.tractor') })}</h3>
                        {/* Using a generic 'No found' message or hardcoded 'No Machines Listed' translation if you prefer adding a specific key */}

                        <button onClick={() => navigate("/add-machine")} className="bg-green-600 text-white px-6 py-2.5 rounded-full font-bold shadow-lg hover:bg-green-700 transition mt-4">
                            {t('rent.list')}
                        </button>
                    </div>
                ) : (
                    machines.map((m) => (
                        <div
                            key={m._id}
                            onClick={() => navigate(`/manage-machine/${m._id}`, { state: { machine: m } })}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center cursor-pointer hover:shadow-md transition"
                        >
                            <img src={m.image} alt={m.name} className="w-20 h-20 rounded-lg object-cover bg-gray-100" />
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800">{m.name}</h3>
                                {/* Dynamic Translation for Machine Type */}
                                <p className="text-xs text-green-600 font-bold uppercase mt-1">
                                    {t(`machines.${m.type.toLowerCase().replace(" ", "_")}`, { defaultValue: m.type })}
                                </p>
                                <p className="text-gray-500 text-sm mt-1">₹{m.price} / {m.priceUnit}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300" />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MyMachines;