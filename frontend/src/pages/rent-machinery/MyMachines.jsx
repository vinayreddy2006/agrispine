import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { Tractor, ChevronRight, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

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
        <div className="min-h-screen bg-agriBg pb-20">
            {/* Header */}
            <PageHeader 
                title={t('rent.my_machines')}
                rightActions={
                    <button onClick={() => navigate("/add-machine")} className="bg-green-600 text-white p-2 rounded-full shadow-md hover:bg-green-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center">
                        <Plus className="w-5 h-5" />
                    </button>
                }
            />

            {/* Content */}
            <div className="max-w-4xl mx-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center mt-10 text-gray-400">Loading inventory...</div>
                ) : machines.length === 0 ? (
                    <EmptyState 
                        title={t('rent.no_found', { type: t('machines.tractor') })}
                        description="You haven't listed any machines for rent yet."
                        icon={Tractor}
                        actionText={t('rent.list')}
                        onAction={() => navigate("/add-machine")}
                    />
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