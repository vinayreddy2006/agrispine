import { useEffect, useState } from "react";
import api from "../../utils/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { 
    User, MapPin, Phone, Edit2, Save, ArrowLeft, LogOut, Camera, 
    Loader2, Leaf, Droplets, BookOpen, Activity, TreePine, Trash2, 
    Plus, Shield, Ban, Tractor, Star, CheckCircle2, Navigation, Sparkles 
} from "lucide-react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { translateText } from "../../utils/translateHelper";
import PageHeader from "../../components/common/PageHeader";
import LocationConfirmationModal from "../../components/common/LocationConfirmationModal";

const Profile = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState("personal"); // personal, farming, machinery, analytics, privacy
    const [showLocationModal, setShowLocationModal] = useState(false);

    const CLOUD_NAME = "dv2ex5war";
    const UPLOAD_PRESET = "agrispine_upload";

    const [userData, setUserData] = useState({
        name: "", phone: "", village: "", mandal: "", district: "", state: "", 
        bio: "", profileImage: "", isLocationConfirmed: false,
        farmingStartYear: "", landPlots: [], mainCrops: "", farmingStyle: "", preferredLanguage: ""
    });

    const [analytics, setAnalytics] = useState({
        activeCrops: 0, completedCrops: 0, expensesRecorded: 0, forumPosts: 0
    });

    const [myMachines, setMyMachines] = useState([]);
    const [loadingMachines, setLoadingMachines] = useState(false);

    const [translatedData, setTranslatedData] = useState({
        name: "", village: "", district: "", bio: ""
    });

    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [blockedUsers, setBlockedUsers] = useState([]);

    const fetchBlockedUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const { data } = await api.get("/auth/blocked", { headers: { "auth-token": token } });
            setBlockedUsers(data || []);
        } catch (err) {}
    };

    const fetchMyMachines = async () => {
        setLoadingMachines(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const { data } = await api.get("/machines/own", { headers: { "auth-token": token } });
            setMyMachines(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching user machines:", err);
        } finally {
            setLoadingMachines(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'privacy') fetchBlockedUsers();
        if (activeTab === 'machinery') fetchMyMachines();
    }, [activeTab]);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) { navigate("/login"); return; }

                const [userRes, analyticsRes] = await Promise.all([
                    api.post("/auth/getuser", {}, { headers: { "auth-token": token } }),
                    api.get("/auth/profile-analytics", { headers: { "auth-token": token } })
                ]);

                const data = userRes.data;
                setUserData({
                    name: data.name || "",
                    phone: data.phone || "",
                    village: data.village || "",
                    mandal: data.mandal || "",
                    district: data.district || "",
                    state: data.state || "",
                    bio: data.bio || "",
                    profileImage: data.profileImage || "",
                    isLocationConfirmed: !!data.isLocationConfirmed,
                    farmingStartYear: data.farmingStartYear || "",
                    landPlots: data.landPlots || [],
                    mainCrops: data.mainCrops ? data.mainCrops.join(", ") : "",
                    farmingStyle: data.farmingStyle || "",
                    preferredLanguage: data.preferredLanguage || "en"
                });

                setAnalytics(analyticsRes.data);

                const tName = await translateText(data.name, i18n.language);
                const tVillage = await translateText(data.village, i18n.language);
                const tDistrict = await translateText(data.district, i18n.language);
                const tBio = await translateText(data.bio, i18n.language);

                setTranslatedData({ name: tName, village: tVillage, district: tDistrict, bio: tBio });
            } catch (err) {
                console.error("Error fetching profile", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [navigate, i18n.language]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleAddPlot = () => {
        setUserData(prev => ({
            ...prev,
            landPlots: [...prev.landPlots, { name: '', size: '', soilType: '', irrigationMethod: '' }]
        }));
    };

    const handleUpdatePlot = (index, field, value) => {
        const newPlots = [...userData.landPlots];
        newPlots[index][field] = value;
        setUserData({ ...userData, landPlots: newPlots });
    };

    const handleRemovePlot = (index) => {
        const newPlots = userData.landPlots.filter((_, i) => i !== index);
        setUserData({ ...userData, landPlots: newPlots });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            let imageUrl = userData.profileImage;
            if (imageFile) {
                const formData = new FormData();
                formData.append("file", imageFile);
                formData.append("upload_preset", UPLOAD_PRESET);
                const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, formData);
                imageUrl = res.data.secure_url;
            }

            const payload = {
                ...userData,
                profileImage: imageUrl,
                mainCrops: userData.mainCrops.split(",").map(c => c.trim()).filter(Boolean)
            };

            const token = localStorage.getItem("token");
            const { data } = await api.put("/auth/updateprofile", payload, { headers: { "auth-token": token } });

            if (data.success) {
                localStorage.setItem("user", JSON.stringify(data.user));
                setUserData({ ...userData, ...data.user, profileImage: imageUrl });
                setImageFile(null);
                Swal.fire("Success", t('profile.update_success', { defaultValue: "Profile updated successfully!" }), "success");
                setIsEditing(false);
                const tName = await translateText(data.user.name, i18n.language);
                setTranslatedData(prev => ({ ...prev, name: tName }));
            }
        } catch (err) {
            Swal.fire("Error", t('profile.update_error', { defaultValue: "Could not update profile" }), "error");
        } finally {
            setUpdating(false);
        }
    };

    const handleLocationConfirmed = (updatedUser) => {
        setUserData(prev => ({
            ...prev,
            village: updatedUser.village,
            mandal: updatedUser.mandal,
            district: updatedUser.district,
            state: updatedUser.state,
            isLocationConfirmed: true
        }));
    };

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        navigate("/login");
    };

    const handleUnblock = async (userId) => {
        try {
            const token = localStorage.getItem("token");
            await api.post(`/auth/unblock/${userId}`, {}, { headers: { "auth-token": token } });
            setBlockedUsers(prev => prev.filter(u => u._id !== userId));
            Swal.fire({ toast: true, position: 'bottom', icon: 'success', title: 'User unblocked', showConfirmButton: false, timer: 1500 });
        } catch (err) {
            Swal.fire("Error", "Could not unblock user", "error");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-green-600" /></div>;

    const fullLocationDisplay = [userData.village, userData.mandal, userData.district, userData.state].filter(Boolean).join(", ");

    return (
        <div className="w-full bg-slate-50 dark:bg-slate-950 min-h-screen pb-16">
            <PageHeader 
                title={t('profile.title', { defaultValue: 'My Farmer Profile' })}
                icon={User}
                rightActions={
                    <>
                        <LanguageSwitcher />
                        <button onClick={handleLogout} className="text-red-500 hover:text-red-700 min-h-[44px] min-w-[44px] flex items-center justify-center bg-white dark:bg-slate-800 rounded-full shadow-sm ml-2 border border-slate-200 dark:border-slate-700">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </>
                }
            />

            <div className="max-w-4xl mx-auto mt-6 px-4">
                
                {/* Profile Header Banner Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 h-36 relative">
                        <div className="absolute -bottom-12 left-6 group">
                            <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full p-1 shadow-md relative">
                                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center overflow-hidden">
                                    {preview || userData.profileImage ? (
                                        <img src={preview || userData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-10 h-10 text-slate-400" />
                                    )}
                                </div>
                                {isEditing && (
                                    <label htmlFor="profile-upload" className="absolute bottom-0 right-0 bg-slate-800 text-white p-2 rounded-full cursor-pointer hover:bg-black transition shadow-lg">
                                        <Camera className="w-4 h-4" />
                                        <input id="profile-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                    </label>
                                )}
                            </div>
                        </div>
                        
                        {!isEditing && (
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                <button 
                                    onClick={() => setShowLocationModal(true)}
                                    className="bg-white/20 hover:bg-white/30 text-white px-3.5 py-2 rounded-xl backdrop-blur-md flex items-center gap-1.5 transition text-xs font-bold"
                                >
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>Verify Farm Location</span>
                                </button>
                                <button 
                                    onClick={() => setIsEditing(true)} 
                                    className="bg-white text-slate-800 hover:bg-slate-100 px-4 py-2 rounded-xl flex items-center gap-1.5 transition text-xs font-bold shadow-sm"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span>Edit Profile</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="pt-16 pb-6 px-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>{translatedData.name || userData.name}</span>
                                    {userData.isLocationConfirmed && (
                                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            <span>Verified Farm</span>
                                        </span>
                                    )}
                                </h2>
                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
                                    <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                    <span>{fullLocationDisplay || "Location not set"}</span>
                                    {!userData.isLocationConfirmed && (
                                        <button 
                                            onClick={() => setShowLocationModal(true)} 
                                            className="text-emerald-600 text-xs font-bold underline ml-1 cursor-pointer"
                                        >
                                            Confirm
                                        </button>
                                    )}
                                </div>
                            </div>

                            {userData.farmingStartYear && (
                                <div className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl font-bold self-start sm:self-auto">
                                    🌾 Farming since {userData.farmingStartYear} ({new Date().getFullYear() - parseInt(userData.farmingStartYear)} yrs)
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-t border-slate-200 dark:border-slate-800 px-4 overflow-x-auto hide-scrollbar gap-2">
                        <button onClick={() => setActiveTab("personal")} className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition ${activeTab === 'personal' ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Personal & Location</button>
                        <button onClick={() => setActiveTab("farming")} className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition ${activeTab === 'farming' ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Farm Details & Crops</button>
                        <button onClick={() => setActiveTab("machinery")} className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${activeTab === 'machinery' ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Tractor className="w-3.5 h-3.5" /> My Machinery</button>
                        <button onClick={() => setActiveTab("analytics")} className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition ${activeTab === 'analytics' ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Activity Analytics</button>
                        <button onClick={() => setActiveTab("privacy")} className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${activeTab === 'privacy' ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Shield className="w-3.5 h-3.5" /> Privacy</button>
                    </div>
                </div>

                {/* Edit Form */}
                {isEditing ? (
                    <form onSubmit={handleUpdate} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-6 animate-in fade-in">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Personal & Location Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label><input value={userData.name} onChange={(e) => setUserData({ ...userData, name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" required /></div>
                                <div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Village / Town</label><input value={userData.village} onChange={(e) => setUserData({ ...userData, village: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                                <div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mandal / Taluk</label><input value={userData.mandal} onChange={(e) => setUserData({ ...userData, mandal: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                                <div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">District</label><input value={userData.district} onChange={(e) => setUserData({ ...userData, district: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                                <div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">State</label><input value={userData.state} onChange={(e) => setUserData({ ...userData, state: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                                <div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone (Login ID)</label><input disabled value={userData.phone} className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm opacity-70 cursor-not-allowed" /></div>
                                <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bio / Farm Description</label><textarea value={userData.bio} onChange={(e) => setUserData({ ...userData, bio: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" rows="2" /></div>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Farming Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Farming Start Year</label><input type="number" value={userData.farmingStartYear} onChange={(e) => setUserData({ ...userData, farmingStartYear: e.target.value })} placeholder="e.g. 2012" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                                <div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Main Crops (comma separated)</label><input value={userData.mainCrops} onChange={(e) => setUserData({ ...userData, mainCrops: e.target.value })} placeholder="Cotton, Paddy, Red Gram" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Farming Style</label>
                                    <select value={userData.farmingStyle} onChange={(e) => setUserData({ ...userData, farmingStyle: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                                        <option value="">Select Style...</option>
                                        <option value="organic">Organic / Natural Farming</option>
                                        <option value="conventional">Conventional Farming</option>
                                        <option value="mixed">Mixed Integrated Farming</option>
                                    </select>
                                </div>
                            </div>

                            {/* Land Plots Edit */}
                            <div className="mt-6">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Land Plots</h4>
                                    <button type="button" onClick={handleAddPlot} className="text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 px-3 py-1.5 rounded-xl flex items-center gap-1 transition">
                                        <Plus className="w-3.5 h-3.5" /> Add Plot
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {userData.landPlots.map((plot, index) => (
                                        <div key={index} className="p-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/40 relative">
                                            <button type="button" onClick={() => handleRemovePlot(index)} className="absolute top-3 right-3 text-rose-500 p-1 hover:bg-rose-50 rounded-lg">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-1">
                                                <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Plot Name</label><input value={plot.name} onChange={(e) => handleUpdatePlot(index, 'name', e.target.value)} placeholder="Main Field" className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white dark:bg-slate-900" /></div>
                                                <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Size (Acres)</label><input type="number" step="0.1" value={plot.size} onChange={(e) => handleUpdatePlot(index, 'size', e.target.value)} placeholder="3.5" className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white dark:bg-slate-900" /></div>
                                                <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Soil Type</label><input value={plot.soilType} onChange={(e) => handleUpdatePlot(index, 'soilType', e.target.value)} placeholder="Black Cotton" className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white dark:bg-slate-900" /></div>
                                                <div><label className="block text-[11px] font-bold text-slate-500 mb-1">Irrigation</label><input value={plot.irrigationMethod} onChange={(e) => handleUpdatePlot(index, 'irrigationMethod', e.target.value)} placeholder="Borewell Drip" className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white dark:bg-slate-900" /></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <button type="button" onClick={() => { setIsEditing(false); setPreview(null); setImageFile(null); }} className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50">Cancel</button>
                            <button type="submit" disabled={updating} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm">
                                {updating ? <Loader2 className="animate-spin w-4 h-4" /> : <><Save className="w-4 h-4" /> Save Changes</>}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 min-h-[300px]">
                        
                        {/* Tab 1: Personal & Location */}
                        {activeTab === 'personal' && (
                            <div className="space-y-4 animate-in fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                        <Phone className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Phone Number</span>
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{userData.phone}</span>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Confirmed Farm Location</span>
                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                                    {fullLocationDisplay || "Not confirmed yet"}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowLocationModal(true)}
                                            className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition"
                                        >
                                            {userData.isLocationConfirmed ? "Update" : "Confirm"}
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Farmer Bio</span>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                                        "{translatedData.bio || userData.bio || "No biography added yet. Click 'Edit Profile' to share details about your farm and experience."}"
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Farming Details */}
                        {activeTab === 'farming' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Experience</span>
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                            <Activity className="w-4 h-4 text-emerald-600" />
                                            <span>{userData.farmingStartYear ? `${new Date().getFullYear() - parseInt(userData.farmingStartYear)} Years (Since ${userData.farmingStartYear})` : "Not specified"}</span>
                                        </span>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Farming Style</span>
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize">
                                            {userData.farmingStyle || "Conventional"}
                                        </span>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 md:col-span-2">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-2">Main Crops Cultivated</span>
                                        <div className="flex flex-wrap gap-2">
                                            {userData.mainCrops ? userData.mainCrops.split(",").map((crop, i) => (
                                                <span key={i} className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200/50 flex items-center gap-1">
                                                    <Leaf className="w-3 h-3 text-emerald-600" />
                                                    <span>{crop.trim()}</span>
                                                </span>
                                            )) : <span className="text-xs text-slate-400">No crops specified</span>}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-3">Configured Land Plots</h4>
                                    {userData.landPlots && userData.landPlots.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {userData.landPlots.map((plot, i) => (
                                                <div key={i} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                                    <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200 dark:border-slate-700">
                                                        <span className="font-bold text-sm text-slate-900 dark:text-white">{plot.name || `Plot ${i + 1}`}</span>
                                                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">{plot.size ? `${plot.size} Acres` : 'N/A'}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                                        <p>Soil: <strong className="text-slate-800 dark:text-slate-200">{plot.soilType || 'N/A'}</strong></p>
                                                        <p>Irrigation: <strong className="text-slate-800 dark:text-slate-200">{plot.irrigationMethod || 'N/A'}</strong></p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">No land plots configured yet.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tab 3: My Machinery */}
                        {activeTab === 'machinery' && (
                            <div className="space-y-4 animate-in fade-in">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                    <h4 className="font-bold text-slate-900 dark:text-white">Machinery Listed for Rent</h4>
                                    <button 
                                        onClick={() => navigate("/add-machine")}
                                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add Machinery</span>
                                    </button>
                                </div>

                                {loadingMachines ? (
                                    <div className="text-center py-10 text-xs text-slate-400">Loading your machinery...</div>
                                ) : myMachines.length === 0 ? (
                                    <div className="text-center py-12 rounded-2xl bg-slate-50 dark:bg-slate-800/40 p-6 space-y-3">
                                        <Tractor className="w-10 h-10 text-slate-400 mx-auto" />
                                        <p className="text-xs text-slate-500 font-semibold">You have not listed any machinery yet.</p>
                                        <button 
                                            onClick={() => navigate("/add-machine")}
                                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                                        >
                                            List Your Tractor or Machinery
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {myMachines.map(m => (
                                            <div 
                                                key={m._id}
                                                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start gap-3"
                                            >
                                                <img 
                                                    src={m.image || "/machines/tractor.png"} 
                                                    alt="" 
                                                    className="w-16 h-16 rounded-xl object-cover bg-white flex-shrink-0" 
                                                />
                                                <div className="flex-1 overflow-hidden">
                                                    <h5 className="font-bold text-sm text-slate-900 dark:text-white truncate">{m.name}</h5>
                                                    <p className="text-xs text-emerald-600 font-bold">₹{m.price} / {m.priceUnit || 'hr'}</p>
                                                    {m.tasks && m.tasks.length > 0 && (
                                                        <span className="text-[10px] text-slate-500 block truncate">
                                                            {m.tasks.length} Operations: {m.tasks.map(t => t.name).slice(0, 2).join(', ')}
                                                        </span>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <button 
                                                            onClick={() => navigate(`/manage-machine/${m._id}`)}
                                                            className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold hover:bg-slate-300"
                                                        >
                                                            Bookings
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab 4: Analytics */}
                        {activeTab === 'analytics' && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-6 rounded-2xl border border-emerald-150 text-center">
                                    <span className="text-3xl font-black text-emerald-600">{analytics.activeCrops}</span>
                                    <span className="text-xs text-emerald-800 font-bold mt-1 block">Active Crops</span>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-950/40 p-6 rounded-2xl border border-blue-150 text-center">
                                    <span className="text-3xl font-black text-blue-600">{analytics.completedCrops}</span>
                                    <span className="text-xs text-blue-800 font-bold mt-1 block">Completed Cycles</span>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-950/40 p-6 rounded-2xl border border-amber-150 text-center">
                                    <span className="text-3xl font-black text-amber-600">{analytics.expensesRecorded}</span>
                                    <span className="text-xs text-amber-800 font-bold mt-1 block">Expenses Logged</span>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-950/40 p-6 rounded-2xl border border-purple-150 text-center">
                                    <span className="text-3xl font-black text-purple-600">{analytics.forumPosts}</span>
                                    <span className="text-xs text-purple-800 font-bold mt-1 block">Community Posts</span>
                                </div>
                            </div>
                        )}

                        {/* Tab 5: Privacy */}
                        {activeTab === 'privacy' && (
                            <div className="space-y-4 animate-in fade-in">
                                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Ban className="w-4 h-4 text-rose-500" />
                                    <span>Blocked Users</span>
                                </h4>
                                {blockedUsers.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center">You have not blocked any users.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {blockedUsers.map(user => (
                                            <div key={user._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-xs">
                                                        {user.name ? user.name[0] : 'U'}
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-sm text-slate-900 dark:text-white">{user.name}</h5>
                                                        <span className="text-[11px] text-slate-400">{user.village || 'No village'}</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleUnblock(user._id)} className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg hover:bg-emerald-200 transition">
                                                    Unblock
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                )}

            </div>

            {/* Location Confirmation Modal */}
            <LocationConfirmationModal
                isOpen={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onLocationConfirmed={handleLocationConfirmed}
                initialData={userData}
            />

        </div>
    );
};

export default Profile;
