import { useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Tractor, ArrowLeft, UploadCloud, Loader2, Image as ImageIcon } from "lucide-react";
import axios from "axios";

const AddMachine = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState(null); // Store the actual file
    const [preview, setPreview] = useState(null);     // Show preview to user

    // --- CONFIGURATION ---
    // Replace these with your actual Cloudinary details
    const CLOUD_NAME = "dv2ex5war";
    const UPLOAD_PRESET = "agrispine_upload";
    // ---------------------

    const [formData, setFormData] = useState({
        name: "",
        type: "Tractor",
        price: "",
        priceUnit: "hour",
        description: "",
        image: "" // This will be filled automatically after upload
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle File Selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file)); // Show a temporary preview
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = formData.image;

            // 1. If user selected a file, Upload to Cloudinary first
            if (imageFile) {
                const data = new FormData();
                data.append("file", imageFile);
                data.append("upload_preset", UPLOAD_PRESET);

                // Upload to Cloudinary
                const response = await axios.post(
                    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                    data
                );
                imageUrl = response.data.secure_url; // Get the URL
            }

            // 2. Send Data to Backend (with the new Image URL)
            const token = localStorage.getItem("token");
            const machineData = { ...formData, image: imageUrl };

            await api.post("/machines/add", machineData, {
                headers: { "auth-token": token }
            });

            await Swal.fire({
                title: 'Success! 🚜',
                text: 'Your machine has been listed with the photo.',
                icon: 'success',
                confirmButtonColor: '#16a34a'
            });

            navigate("/rent-machinery");

        } catch (err) {
            console.error(err);
            Swal.fire({
                title: 'Error',
                text: 'Upload failed. Check your internet or try a smaller image.',
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
                        <p className="text-sm text-gray-500">Upload a photo and details</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* --- NEW: Image Upload Section --- */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Machine Photo</label>
                        <div className="flex items-center gap-4">
                            {/* Preview Box */}
                            <div className="w-24 h-24 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                                {preview ? (
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="text-gray-400 w-8 h-8" />
                                )}
                            </div>

                            {/* Upload Button */}
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    id="file-upload"
                                    className="hidden"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2 w-max"
                                >
                                    <UploadCloud className="w-4 h-4" /> Click to Upload Photo
                                </label>
                                <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG (Max 5MB)</p>
                            </div>
                        </div>
                    </div>
                    {/* --------------------------------- */}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Machine Name</label>
                        <input name="name" placeholder="e.g. Mahindra 575 DI" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select name="type" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="Tractor">Tractor 🚜</option>
                                <option value="Harvester">Harvester 🌾</option>
                                <option value="Rotavator">Rotavator ⚙️</option>
                                <option value="Drone">Drone 🚁</option>
                                <option value="JCB">JCB / Excavator 🏗️</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rental Price (₹)</label>
                            <input name="price" type="number" placeholder="1200" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Model</label>
                        <select name="priceUnit" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="hour">Per Hour</option>
                            <option value="acre">Per Acre</option>
                            <option value="day">Per Day</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea name="description" rows="2" placeholder="e.g. 45HP Tractor, Good Condition" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-lg text-white font-semibold flex justify-center items-center gap-2 transition
              ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin w-5 h-5" /> Uploading Image...
                            </>
                        ) : "List Machine Now"}
                    </button>
                </form>

            </div>
        </div>
    );
};

export default AddMachine;