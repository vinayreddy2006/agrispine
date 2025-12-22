import { useEffect, useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2"; // Import SweetAlert
import {
    Tractor, Phone, ArrowLeft, PlusCircle, User, Search, Filter, X, Trash2
} from "lucide-react";

const RentMachinery = () => {
    const navigate = useNavigate();
    const [machines, setMachines] = useState([]);
    const [filteredMachines, setFilteredMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null); // To store "Who am I?"

    // --- Search & Filter States ---
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("All");
    const [maxPrice, setMaxPrice] = useState("");

    // 1. Fetch Data & User
    useEffect(() => {
        const initialize = async () => {
            try {
                const token = localStorage.getItem("token");
                const userStr = localStorage.getItem("user");
                if (userStr) setCurrentUser(JSON.parse(userStr));

                const { data } = await api.get("/machines/fetchall", {
                    headers: { "auth-token": token }
                });
                setMachines(data);
                setFilteredMachines(data);
            } catch (err) {
                console.error("Failed to fetch machines", err);
            } finally {
                setLoading(false);
            }
        };
        initialize();
    }, []);

    // 2. Filter Logic
    useEffect(() => {
        let result = machines;

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(m =>
                m.name.toLowerCase().includes(lowerTerm) ||
                m.description?.toLowerCase().includes(lowerTerm) ||
                m.type.toLowerCase().includes(lowerTerm)
            );
        }

        if (selectedType !== "All") {
            result = result.filter(m => m.type === selectedType);
        }

        if (maxPrice) {
            result = result.filter(m => m.price <= parseInt(maxPrice));
        }

        setFilteredMachines(result);
    }, [searchTerm, selectedType, maxPrice, machines]);

    // 3. Handle Delete (NEW)
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                await api.delete(`/machines/delete/${id}`, {
                    headers: { "auth-token": token }
                });

                // Remove from list immediately
                setMachines(machines.filter(m => m._id !== id));
                Swal.fire('Deleted!', 'Your machine has been removed.', 'success');
            } catch (err) {
                Swal.fire('Error', 'Could not delete machine.', 'error');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10">

            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10 px-6 py-4">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate("/dashboard")} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Tractor className="text-green-600" /> Machinery
                        </h1>
                    </div>

                    <button
                        onClick={() => navigate("/add-machine")}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition font-medium text-sm"
                    >
                        <PlusCircle className="w-4 h-4" /> List Machine
                    </button>
                </div>

                {/* Search & Filter Bar */}
                <div className="max-w-6xl mx-auto mt-4 grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5 relative">
                        <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <input
                            placeholder="Search tractors, harvesters..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-3">
                        <select
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white text-gray-700"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                        >
                            <option value="All">All Types</option>
                            <option value="Tractor">Tractor 🚜</option>
                            <option value="Harvester">Harvester 🌾</option>
                            <option value="Drone">Drone 🚁</option>
                            <option value="Rotavator">Rotavator ⚙️</option>
                            <option value="JCB">JCB / Excavator 🏗️</option>
                        </select>
                    </div>
                    <div className="md:col-span-3">
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500 text-sm font-bold">₹</span>
                            <input
                                type="number"
                                placeholder="Max Price"
                                className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        {(searchTerm || selectedType !== "All" || maxPrice) && (
                            <button
                                onClick={() => { setSearchTerm(""); setSelectedType("All"); setMaxPrice(""); }}
                                className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 hover:text-red-500 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto p-6">
                {loading ? (
                    <p className="text-center text-gray-500 mt-10">Loading available machines...</p>
                ) : filteredMachines.length === 0 ? (
                    <div className="text-center bg-white p-16 rounded-xl shadow-sm border border-gray-200">
                        <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700">No Machines Found</h3>
                        <button
                            onClick={() => { setSearchTerm(""); setSelectedType("All"); setMaxPrice(""); }}
                            className="text-green-600 font-bold hover:underline"
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMachines.map((machine) => {
                            // Check Ownership
                            const isOwner = currentUser && (
                                (machine.user?._id && String(machine.user._id) === String(currentUser._id || currentUser.id)) ||
                                (machine.user && String(machine.user) === String(currentUser._id || currentUser.id))
                            );

                            return (
                                <div key={machine._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group">
                                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                                        <img
                                            src={machine.image || "https://cdn-icons-png.flaticon.com/512/2318/2318736.png"}
                                            alt={machine.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                        />
                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
                                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{machine.type}</span>
                                        </div>
                                        {/* Delete Button (Only for Owner) */}
                                        {isOwner && (
                                            <button
                                                onClick={() => handleDelete(machine._id)}
                                                className="absolute top-3 left-3 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-600 hover:text-white transition shadow-sm z-10"
                                                title="Delete this machine"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="p-5">
                                        <h3 className="text-lg font-bold text-gray-800 line-clamp-1 mb-2">{machine.name}</h3>
                                        <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[40px]">{machine.description}</p>

                                        <div className="flex justify-between items-end border-t pt-4 border-gray-100">
                                            <div>
                                                <p className="text-xs text-gray-400 mb-0.5">Price</p>
                                                <p className="font-bold text-green-700 text-lg">₹{machine.price} <span className="text-xs font-medium text-gray-400">/ {machine.priceUnit}</span></p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400 mb-1">Owner</p>
                                                <div className="flex items-center gap-1.5 text-gray-700 text-sm font-medium">
                                                    <User className="w-3.5 h-3.5 text-gray-400" />
                                                    {machine.user?.name || "Farmer"}
                                                    {isOwner && <span className="text-[10px] text-green-600 bg-green-100 px-1.5 rounded-full">(You)</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <a
                                            href={`tel:${machine.user?.phone}`}
                                            className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition shadow-sm active:scale-95"
                                        >
                                            <Phone className="w-4 h-4" /> Call Owner
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RentMachinery;