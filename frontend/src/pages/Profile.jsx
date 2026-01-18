import { useEffect, useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { User, MapPin, Phone, Edit2, Save, ArrowLeft, LogOut, Camera, Loader2, UploadCloud } from "lucide-react";
import axios from "axios";

const Profile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false); // State for save button loading
    const [isEditing, setIsEditing] = useState(false);

    // --- CLOUDINARY CONFIG ---
    const CLOUD_NAME = "dv2ex5war";
    const UPLOAD_PRESET = "agrispine_upload";

    const [userData, setUserData] = useState({
        name: "",
        phone: "",
        village: "",
        district: "",
        bio: "",
        profileImage: ""
    });

    const [imageFile, setImageFile] = useState(null); // To store selected file
    const [preview, setPreview] = useState(null);     // To show preview immediately

    // 1. Fetch User Data
    useEffect(() => {
        const getUser = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) { navigate("/login"); return; }

                const { data } = await api.post("/auth/getuser", {}, {
                    headers: { "auth-token": token }
                });

                setUserData({
                    name: data.name,
                    phone: data.phone,
                    village: data.village || "",
                    district: data.district || "",
                    bio: data.bio || "",
                    profileImage: data.profileImage || ""
                });
            } catch (err) {
                console.error("Error fetching profile");
            } finally {
                setLoading(false);
            }
        };
        getUser();
    }, [navigate]);

    // 2. Handle File Selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    // 3. Handle Update (Upload Image -> Save Profile)
    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);

        try {
            let imageUrl = userData.profileImage;

            // A. Upload Image if a new one is selected
            if (imageFile) {
                const formData = new FormData();
                formData.append("file", imageFile);
                formData.append("upload_preset", UPLOAD_PRESET);

                const res = await axios.post(
                    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                    formData
                );
                imageUrl = res.data.secure_url;
            }

            // B. Save Profile to Backend
            const token = localStorage.getItem("token");
            const { data } = await api.put("/auth/updateprofile", { ...userData, profileImage: imageUrl }, {
                headers: { "auth-token": token }
            });

            if (data.success) {
                // Update Local Storage so Navbar updates immediately
                localStorage.setItem("user", JSON.stringify(data.user));
                setUserData({ ...userData, profileImage: imageUrl }); // Update state
                setImageFile(null); // Clear file input

                Swal.fire("Success", "Profile updated successfully!", "success");
                setIsEditing(false);
            }
        } catch (err) {
            Swal.fire("Error", "Could not update profile", "error");
        } finally {
            setUpdating(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-green-600" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">

            {/* Header */}
            <div className="w-full max-w-md flex justify-between items-center mb-8">
                <button onClick={() => navigate("/dashboard")} className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
                    <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <h1 className="text-xl font-bold text-gray-800">My Profile</h1>
                <button onClick={handleLogout} className="text-red-500 hover:text-red-700">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            <div className="bg-white w-full max-w-md rounded-2xl shadow-lg overflow-hidden border border-gray-100">

                {/* Banner */}
                <div className="bg-gradient-to-r from-green-400 to-green-600 h-32 relative">
                    <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 group">

                        {/* PROFILE PICTURE CIRCLE */}
                        <div className="w-28 h-28 bg-white rounded-full p-1 shadow-md relative">
                            <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                {preview || userData.profileImage ? (
                                    <img
                                        src={preview || userData.profileImage}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-12 h-12 text-gray-400" />
                                )}
                            </div>

                            {/* Camera Icon Overlay (Only in Edit Mode) */}
                            {isEditing && (
                                <label htmlFor="profile-upload" className="absolute bottom-0 right-0 bg-gray-800 text-white p-2 rounded-full cursor-pointer hover:bg-black transition shadow-lg">
                                    <Camera className="w-4 h-4" />
                                    <input
                                        id="profile-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            )}
                        </div>

                    </div>
                </div>

                <div className="pt-16 pb-8 px-8">

                    {!isEditing ? (
                        <div className="text-center animate-in fade-in">
                            <h2 className="text-2xl font-bold text-gray-800">{userData.name}</h2>
                            <div className="flex items-center justify-center gap-2 text-gray-500 mt-1 text-sm">
                                <MapPin className="w-4 h-4" />
                                <span>{userData.village || "Village not set"}</span>
                                {userData.district && <span>• {userData.district}</span>}
                            </div>

                            <div className="mt-6 bg-gray-50 p-4 rounded-xl text-left space-y-3 border border-gray-100">
                                <div className="flex items-center gap-3 text-gray-700">
                                    <Phone className="w-5 h-5 text-green-600" />
                                    <span className="font-medium">{userData.phone}</span>
                                </div>
                                <div className="flex items-start gap-3 text-gray-700">
                                    <User className="w-5 h-5 text-green-600 mt-0.5" />
                                    <span className="italic text-gray-600">"{userData.bio || "No bio added yet."}"</span>
                                </div>
                            </div>

                            <button onClick={() => setIsEditing(true)} className="mt-6 w-full bg-gray-800 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 transition">
                                <Edit2 className="w-4 h-4" /> Edit Profile
                            </button>
                        </div>
                    ) : (
                        /* Edit Form */
                        <form onSubmit={handleUpdate} className="space-y-4 animate-in fade-in">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input value={userData.name} onChange={(e) => setUserData({ ...userData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-green-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
                                    <input value={userData.village} onChange={(e) => setUserData({ ...userData, village: e.target.value })} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-green-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                                    <input value={userData.district} onChange={(e) => setUserData({ ...userData, district: e.target.value })} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-green-500" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bio (About Me)</label>
                                <textarea value={userData.bio} onChange={(e) => setUserData({ ...userData, bio: e.target.value })} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-green-500" rows="3" />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => { setIsEditing(false); setPreview(null); setImageFile(null); }} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium">Cancel</button>
                                <button type="submit" disabled={updating} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
                                    {updating ? <Loader2 className="animate-spin w-4 h-4" /> : <><Save className="w-4 h-4" /> Save</>}
                                </button>
                            </div>
                        </form>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Profile;