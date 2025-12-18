import { useEffect, useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { Tractor, Phone, ArrowLeft, PlusCircle, User } from "lucide-react";

const RentMachinery = () => {
    const navigate = useNavigate();
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMachines = async () => {
            try {
                const token = localStorage.getItem("token");
                const { data } = await api.get("/machines/fetchall", {
                    headers: { "auth-token": token }
                });
                setMachines(data);
            } catch (err) {
                console.error("Failed to fetch machines", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMachines();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <button onClick={() => navigate("/dashboard")} className="flex items-center text-gray-600 hover:text-green-700 transition">
                        <ArrowLeft className="w-5 h-5 mr-1" /> Back
                    </button>

                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Tractor className="text-green-600" /> Machinery Rental
                    </h1>

                    <button
                        onClick={() => navigate("/add-machine")}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition"
                    >
                        <PlusCircle className="w-4 h-4" /> List Your Machine
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <p className="text-center text-gray-500 mt-10">Loading available machines...</p>
                ) : machines.length === 0 ? (
                    <div className="text-center bg-white p-10 rounded-xl shadow-sm border border-gray-200">
                        <Tractor className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700">No Machines Available</h3>
                        <p className="text-gray-500 mb-6">Be the first to list a tractor for rent!</p>
                        <button onClick={() => navigate("/add-machine")} className="text-green-600 font-bold hover:underline">
                            List a Machine Now
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {machines.map((machine) => (
                            <div key={machine._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                                {/* Image Placeholder */}
                                <div className="h-40 bg-gray-100 flex items-center justify-center">
                                    <img src={machine.image} alt={machine.name} className="h-24 opacity-80" />
                                </div>

                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-gray-800">{machine.name}</h3>
                                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full uppercase">
                                            {machine.type}
                                        </span>
                                    </div>

                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{machine.description || "No description provided."}</p>

                                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mb-4">
                                        <div>
                                            <p className="text-xs text-gray-500">Price</p>
                                            <p className="font-bold text-green-700">₹{machine.price} <span className="text-xs font-normal text-gray-500">/ {machine.priceUnit}</span></p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Owner</p>
                                            <div className="flex items-center gap-1 justify-end">
                                                <User className="w-3 h-3 text-gray-400" />
                                                <p className="font-semibold text-gray-700 text-sm">{machine.user?.name || "Farmer"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <a
                                        href={`tel:${machine.user?.phone}`}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition"
                                    >
                                        <Phone className="w-4 h-4" /> Call Owner
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RentMachinery;