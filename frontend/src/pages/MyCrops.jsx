import { useEffect, useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { Plus, Sprout, Calendar, ChevronRight, CheckCircle, Leaf } from "lucide-react";

const MyCrops = () => {
    const navigate = useNavigate();
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCrops = async () => {
            try {
                const token = localStorage.getItem("token");
                const { data } = await api.get("/crops/fetchall", { headers: { "auth-token": token } });
                setCrops(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCrops();
    }, []);

    return (
        <div className="w-full">

            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10 px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Sprout className="text-green-600 w-7 h-7" /> My Crops
                </h1>
                <button
                    onClick={() => navigate("/add-crop")}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm transition"
                >
                    <Plus className="w-4 h-4" /> Add New
                </button>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-6 mt-6">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-gray-200"></div>)}
                    </div>
                ) : crops.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                        <Leaf className="w-16 h-16 mx-auto text-gray-200 mb-3" />
                        <h3 className="text-lg font-medium text-gray-600">No crops yet</h3>
                        <p className="text-gray-400 text-sm mb-4">Start tracking your farm today.</p>
                        <button onClick={() => navigate("/add-crop")} className="text-green-600 font-bold hover:underline">
                            Add your first crop
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {crops.map((crop) => (
                            <div
                                key={crop._id}
                                onClick={() => navigate(`/crop/${crop._id}`)}
                                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer flex justify-between items-center group"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Icon based on status */}
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${crop.status === 'sold' ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {crop.status === 'sold' ? <CheckCircle className="w-6 h-6" /> : <Sprout className="w-6 h-6" />}
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-green-700 transition">{crop.cropName}</h3>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">{crop.area} Acres</span>
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(crop.sowingDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-600 transition" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

export default MyCrops;