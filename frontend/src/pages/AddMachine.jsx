import { useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Tractor, ArrowLeft, UploadCloud, Loader2 } from "lucide-react";

const AddMachine = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        type: "Tractor", // Default
        price: "",
        priceUnit: "hour", // Default
        description: "",
        image: "https://cdn-icons-png.flaticon.com/512/2318/2318736.png" // Default Placeholder
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem("token");

        try {
            await api.post("/machines/add", formData, {
                headers: { "auth-token": token }
            });

            await Swal.fire({
                title: 'Machine Listed! 🚜',
                text: 'Your machine is now visible to other farmers.',
                icon: 'success',
                confirmButtonColor: '#16a34a'
            });

            navigate("/rent-machinery");

        } catch (err) {
            console.error(err);
            Swal.fire({
                title: 'Error',
                text: 'Could not list machine. Please try again.',
                icon: 'error',
                confirmButtonColor: '#d33'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-lg border border-gray-100 p-8">

                {/* Header */}
                <button
                    onClick={() => navigate("/rent-machinery")}
                    className="flex items-center text-gray-500 hover:text-gray-800 mb-6 transition"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Rentals
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-100 p-3 rounded-full">
                        <Tractor className="w-8 h-8 text-blue-700" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">List Your Machine</h1>
                        <p className="text-sm text-gray-500">Rent out your equipment to neighbors</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Machine Name</label>
                        <input
                            name="name"
                            placeholder="e.g. Mahindra 575 DI"
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                name="type"
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="Tractor">Tractor 🚜</option>
                                <option value="Harvester">Harvester 🌾</option>
                                <option value="Rotavator">Rotavator ⚙️</option>
                                <option value="Drone">Drone 🚁</option>
                                <option value="JCB">JCB / Excavator 🏗️</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                            <div className="relative">
                                <input
                                    name="image"
                                    placeholder="https://..."
                                    onChange={handleChange}
                                    className="w-full pl-10 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <UploadCloud className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rental Price (₹)</label>
                            <input
                                name="price"
                                type="number"
                                placeholder="1200"
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Per Unit</label>
                            <select
                                name="priceUnit"
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="hour">Per Hour</option>
                                <option value="acre">Per Acre</option>
                                <option value="day">Per Day</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Condition, HP, etc.)</label>
                        <textarea
                            name="description"
                            rows="3"
                            placeholder="e.g. 45HP Tractor with Rotavator attachment available."
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-lg text-white font-semibold flex justify-center items-center gap-2 transition
              ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "List Machine Now"}
                    </button>
                </form>

            </div>
        </div>
    );
};

export default AddMachine;