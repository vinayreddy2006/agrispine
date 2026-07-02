import { useEffect, useState } from "react";
import api from "../../utils/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { User, MapPin, Phone, Edit2, Save, ArrowLeft, LogOut, Camera, Loader2, Leaf, Droplets, BookOpen, Activity, TreePine, Trash2, Plus, Shield, Ban } from "lucide-react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { translateText } from "../../utils/translateHelper";
import PageHeader from "../../components/common/PageHeader";

const Profile = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState("personal"); // personal, farming, analytics

    const CLOUD_NAME = "dv2ex5war";
    const UPLOAD_PRESET = "agrispine_upload";

    const [userData, setUserData] = useState({
        name: "", phone: "", village: "", district: "", bio: "", profileImage: "",
        farmingStartYear: "", landPlots: [], mainCrops: "", farmingStyle: "", preferredLanguage: ""
    });

    const [analytics, setAnalytics] = useState({
        activeCrops: 0, completedCrops: 0, expensesRecorded: 0, forumPosts: 0
    });

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

    useEffect(() => {
        if (activeTab === 'privacy') fetchBlockedUsers();
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
                    district: data.district || "",
                    bio: data.bio || "",
                    profileImage: data.profileImage || "",
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
                setUserData({ ...userData, profileImage: imageUrl });
                setImageFile(null);
                Swal.fire("Success", t('profile.update_success', { defaultValue: "Profile updated!" }), "success");
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

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const handleUnblock = async (userId) => {
        try {
            const token = localStorage.getItem("token");
            await api.post(`/auth/unblock/${userId}`, {}, { headers: { "auth-token": token } });
            setBlockedUsers(prev => prev.filter(u => u._id !== userId));
            // Update local user state if needed, though they need to refresh to see it in chat
            Swal.fire({ toast: true, position: 'bottom', icon: 'success', title: 'User unblocked', showConfirmButton: false, timer: 1500 });
        } catch (err) {
            Swal.fire("Error", "Could not unblock user", "error");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-green-600" /></div>;

    return (
        <div className="w-full bg-agriBg min-h-screen pb-12">
            <PageHeader 
                title={t('profile.title', { defaultValue: 'My Profile' })}
                icon={User}
                rightActions={
                    <>
                        <LanguageSwitcher />
                        <button onClick={handleLogout} className="text-red-500 hover:text-red-700 min-h-[44px] min-w-[44px] flex items-center justify-center bg-white rounded-full shadow-sm ml-2 border border-gray-100">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </>
                }
            />

            <div className="max-w-3xl mx-auto mt-6 px-4">
                <div className="bg-surface dark:bg-gray-800 rounded-2xl shadow-sm border border-border dark:border-gray-700 overflow-hidden mb-6">
                    {/* Header Image Area */}
                    <div className="bg-gradient-to-r from-green-500 to-green-700 h-32 relative">
                        <div className="absolute -bottom-12 left-6 group">
                            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md relative">
                                <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                    {preview || userData.profileImage ? (
                                        <img src={preview || userData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-10 h-10 text-gray-400" />
                                    )}
                                </div>
                                {isEditing && (
                                    <label htmlFor="profile-upload" className="absolute bottom-0 right-0 bg-gray-800 text-white p-2 rounded-full cursor-pointer hover:bg-black transition shadow-lg">
                                        <Camera className="w-4 h-4" />
                                        <input id="profile-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                    </label>
                                )}
                            </div>
                        </div>
                        
                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg backdrop-blur-md flex items-center gap-2 transition text-sm font-bold min-h-[44px]">
                                <Edit2 className="w-4 h-4" /> Edit Profile
                            </button>
                        )}
                    </div>

                    <div className="pt-16 pb-6 px-6">
                        <h2 className="text-2xl font-bold text-text-primary dark:text-white">{translatedData.name || userData.name}</h2>
                        <div className="flex items-center gap-2 text-text-muted dark:text-gray-400 mt-1 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>{translatedData.village || userData.village || 'No village'}</span>
                            {(translatedData.district || userData.district) && <span>• {translatedData.district || userData.district}</span>}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-t border-border dark:border-gray-700 px-2 overflow-x-auto hide-scrollbar">
                        <button onClick={() => setActiveTab("personal")} className={`px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap min-h-[44px] ${activeTab === 'personal' ? 'border-green-600 text-green-700 dark:text-green-400' : 'border-transparent text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-white'}`}>Personal Info</button>
                        <button onClick={() => setActiveTab("farming")} className={`px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap min-h-[44px] ${activeTab === 'farming' ? 'border-green-600 text-green-700 dark:text-green-400' : 'border-transparent text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-white'}`}>Farming Details</button>
                        <button onClick={() => setActiveTab("analytics")} className={`px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap min-h-[44px] ${activeTab === 'analytics' ? 'border-green-600 text-green-700 dark:text-green-400' : 'border-transparent text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-white'}`}>Analytics</button>
                        <button onClick={() => setActiveTab("privacy")} className={`px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap min-h-[44px] flex items-center gap-2 ${activeTab === 'privacy' ? 'border-green-600 text-green-700 dark:text-green-400' : 'border-transparent text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-white'}`}><Shield className="w-4 h-4"/> Privacy</button>
                    </div>
                </div>

                {isEditing ? (
                    <form onSubmit={handleUpdate} className="bg-surface dark:bg-gray-800 rounded-2xl shadow-sm border border-border dark:border-gray-700 p-6 space-y-6 animate-in fade-in">
                        <div>
                            <h3 className="font-bold text-text-primary dark:text-white mb-4 border-b border-border dark:border-gray-700 pb-2">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Full Name</label><input value={userData.name} onChange={(e) => setUserData({ ...userData, name: e.target.value })} className="w-full px-4 py-2 border border-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-surface dark:bg-gray-700 text-text-primary dark:text-white" required /></div>
                                <div><label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Village</label><input value={userData.village} onChange={(e) => setUserData({ ...userData, village: e.target.value })} className="w-full px-4 py-2 border border-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-surface dark:bg-gray-700 text-text-primary dark:text-white" /></div>
                                <div><label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">District</label><input value={userData.district} onChange={(e) => setUserData({ ...userData, district: e.target.value })} className="w-full px-4 py-2 border border-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-surface dark:bg-gray-700 text-text-primary dark:text-white" /></div>
                                <div className="md:col-span-2"><label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Bio</label><textarea value={userData.bio} onChange={(e) => setUserData({ ...userData, bio: e.target.value })} className="w-full px-4 py-2 border border-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-surface dark:bg-gray-700 text-text-primary dark:text-white" rows="2" /></div>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="font-bold text-text-primary dark:text-white mb-4 border-b border-border dark:border-gray-700 pb-2">Farming Details (Optional)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Farming Start Year</label><input type="number" value={userData.farmingStartYear} onChange={(e) => setUserData({ ...userData, farmingStartYear: e.target.value })} placeholder="e.g. 2010" className="w-full px-4 py-2 border border-border dark:border-gray-600 rounded-lg bg-surface dark:bg-gray-700 text-text-primary dark:text-white focus:ring-2 focus:ring-green-500 outline-none" /></div>
                                <div><label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Main Crops</label><input value={userData.mainCrops} onChange={(e) => setUserData({ ...userData, mainCrops: e.target.value })} placeholder="Comma separated" className="w-full px-4 py-2 border border-border dark:border-gray-600 rounded-lg bg-surface dark:bg-gray-700 text-text-primary dark:text-white focus:ring-2 focus:ring-green-500 outline-none" /></div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">Farming Style</label>
                                    <select value={userData.farmingStyle} onChange={(e) => setUserData({ ...userData, farmingStyle: e.target.value })} className="w-full px-4 py-2 border border-border dark:border-gray-600 rounded-lg bg-surface dark:bg-gray-700 text-text-primary dark:text-white focus:ring-2 focus:ring-green-500 outline-none">
                                        <option value="">Select Style...</option>
                                        <option value="organic">Organic</option>
                                        <option value="conventional">Conventional</option>
                                        <option value="mixed">Mixed</option>
                                    </select>
                                </div>
                            </div>

                            {/* Land Plots Edit Array */}
                            <div className="mt-6">
                                <div className="flex justify-between items-center mb-4 border-b border-border dark:border-gray-700 pb-2">
                                    <h3 className="font-bold text-text-primary dark:text-white">Land Plots</h3>
                                    <button type="button" onClick={handleAddPlot} className="text-xs font-bold bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-green-200 dark:hover:bg-green-800/50 transition">
                                        <Plus className="w-3 h-3" /> Add Plot
                                    </button>
                                </div>
                                {userData.landPlots.length === 0 ? (
                                    <p className="text-sm text-text-muted dark:text-gray-500 italic">No plots added. Add your plots above.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {userData.landPlots.map((plot, index) => (
                                            <div key={index} className="p-4 border border-border dark:border-gray-700 rounded-xl bg-background dark:bg-gray-900/50 relative group">
                                                <button type="button" onClick={() => handleRemovePlot(index)} className="absolute top-2 right-2 text-text-muted dark:text-gray-500 hover:text-red-500 transition opacity-50 group-hover:opacity-100 bg-surface dark:bg-gray-800 p-1 rounded-md border border-border dark:border-gray-700">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                                    <div><label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-1">Plot Name</label><input value={plot.name} onChange={(e) => handleUpdatePlot(index, 'name', e.target.value)} placeholder="e.g. North Field" className="w-full px-3 py-1.5 text-sm border border-border dark:border-gray-600 rounded-lg bg-surface dark:bg-gray-800 text-text-primary dark:text-white focus:ring-2 focus:ring-green-500 outline-none" /></div>
                                                    <div><label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-1">Size (Acres)</label><input type="number" step="0.1" value={plot.size} onChange={(e) => handleUpdatePlot(index, 'size', e.target.value)} placeholder="e.g. 2.5" className="w-full px-3 py-1.5 text-sm border border-border dark:border-gray-600 rounded-lg bg-surface dark:bg-gray-800 text-text-primary dark:text-white focus:ring-2 focus:ring-green-500 outline-none" /></div>
                                                    <div><label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-1">Soil Type</label><input value={plot.soilType} onChange={(e) => handleUpdatePlot(index, 'soilType', e.target.value)} placeholder="e.g. Red Soil" className="w-full px-3 py-1.5 text-sm border border-border dark:border-gray-600 rounded-lg bg-surface dark:bg-gray-800 text-text-primary dark:text-white focus:ring-2 focus:ring-green-500 outline-none" /></div>
                                                    <div><label className="block text-xs font-medium text-text-secondary dark:text-gray-400 mb-1">Irrigation Method</label><input value={plot.irrigationMethod} onChange={(e) => handleUpdatePlot(index, 'irrigationMethod', e.target.value)} placeholder="e.g. Drip" className="w-full px-3 py-1.5 text-sm border border-border dark:border-gray-600 rounded-lg bg-surface dark:bg-gray-800 text-text-primary dark:text-white focus:ring-2 focus:ring-green-500 outline-none" /></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-border dark:border-gray-700">
                            <button type="button" onClick={() => { setIsEditing(false); setPreview(null); setImageFile(null); }} className="flex-1 bg-surface dark:bg-gray-800 text-text-primary dark:text-white border border-border dark:border-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 min-h-[44px]">Cancel</button>
                            <button type="submit" disabled={updating} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 min-h-[44px]">
                                {updating ? <Loader2 className="animate-spin w-5 h-5" /> : <><Save className="w-5 h-5" /> Save Profile</>}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="bg-surface dark:bg-gray-800 rounded-2xl shadow-sm border border-border dark:border-gray-700 p-6 min-h-[300px]">
                        {activeTab === 'personal' && (
                            <div className="space-y-4 animate-in fade-in">
                                <div className="flex items-center gap-4 p-4 bg-background dark:bg-gray-900/50 rounded-xl border border-border dark:border-gray-700">
                                    <Phone className="text-text-muted dark:text-gray-500 w-6 h-6" />
                                    <div>
                                        <p className="text-xs text-text-muted dark:text-gray-500 font-bold uppercase tracking-wider">Phone Number</p>
                                        <p className="font-medium text-text-primary dark:text-white">{userData.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-background dark:bg-gray-900/50 rounded-xl border border-border dark:border-gray-700">
                                    <BookOpen className="text-text-muted dark:text-gray-500 w-6 h-6 mt-1" />
                                    <div>
                                        <p className="text-xs text-text-muted dark:text-gray-500 font-bold uppercase tracking-wider">Biography</p>
                                        <p className="text-text-secondary dark:text-gray-300 mt-1 leading-relaxed">"{translatedData.bio || userData.bio || 'No biography added yet.'}"</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'farming' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 border border-border dark:border-gray-700 rounded-xl bg-background dark:bg-gray-900/50 flex flex-col gap-1">
                                        <span className="text-xs text-text-muted dark:text-gray-500 font-bold uppercase">Experience</span>
                                        <span className="font-semibold text-text-primary dark:text-white flex items-center gap-2"><Activity className="w-4 h-4 text-green-600"/> {userData.farmingStartYear ? `${new Date().getFullYear() - parseInt(userData.farmingStartYear)} Years (Since ${userData.farmingStartYear})` : 'Not specified'}</span>
                                    </div>
                                    <div className="p-4 border border-border dark:border-gray-700 rounded-xl bg-background dark:bg-gray-900/50 flex flex-col gap-1 md:col-span-2">
                                        <span className="text-xs text-text-muted dark:text-gray-500 font-bold uppercase">Main Crops</span>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {userData.mainCrops ? userData.mainCrops.split(",").map((crop, i) => (
                                                <span key={i} className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1"><Leaf className="w-3 h-3"/> {crop.trim()}</span>
                                            )) : <span className="text-sm text-text-muted dark:text-gray-500">Not specified</span>}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-text-primary dark:text-white mb-3">Land Plots</h3>
                                    {userData.landPlots && userData.landPlots.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {userData.landPlots.map((plot, i) => (
                                                <div key={i} className="p-4 border border-border dark:border-gray-700 rounded-xl bg-background dark:bg-gray-900/50">
                                                    <h4 className="font-bold text-text-primary dark:text-white mb-2 border-b border-border dark:border-gray-700 pb-1 flex items-center justify-between">
                                                        <span>{plot.name || `Plot ${i + 1}`}</span>
                                                        <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-md">{plot.size ? `${plot.size} Acres` : 'N/A'}</span>
                                                    </h4>
                                                    <div className="space-y-1 mt-2 text-sm text-text-secondary dark:text-gray-300">
                                                        <div className="flex justify-between">
                                                            <span className="text-text-muted dark:text-gray-500"><TreePine className="inline w-3 h-3 mr-1"/> Soil:</span>
                                                            <span className="font-medium">{plot.soilType || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-text-muted dark:text-gray-500"><Droplets className="inline w-3 h-3 mr-1"/> Irrigation:</span>
                                                            <span className="font-medium">{plot.irrigationMethod || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-text-muted dark:text-gray-500 italic p-4 border border-border dark:border-gray-700 rounded-xl bg-background dark:bg-gray-900/50 text-center">No plots configured.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'analytics' && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-100 dark:border-green-900/30 text-center flex flex-col justify-center">
                                    <span className="text-3xl font-black text-green-600 dark:text-green-400">{analytics.activeCrops}</span>
                                    <span className="text-sm text-green-800 dark:text-green-300 font-medium mt-1">Active Crops</span>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30 text-center flex flex-col justify-center">
                                    <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{analytics.completedCrops}</span>
                                    <span className="text-sm text-blue-800 dark:text-blue-300 font-medium mt-1">Completed</span>
                                </div>
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl border border-orange-100 dark:border-orange-900/30 text-center flex flex-col justify-center">
                                    <span className="text-3xl font-black text-orange-600 dark:text-orange-400">{analytics.expensesRecorded}</span>
                                    <span className="text-sm text-orange-800 dark:text-orange-300 font-medium mt-1">Expenses Logged</span>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border border-purple-100 dark:border-purple-900/30 text-center flex flex-col justify-center">
                                    <span className="text-3xl font-black text-purple-600 dark:text-purple-400">{analytics.forumPosts}</span>
                                    <span className="text-sm text-purple-800 dark:text-purple-300 font-medium mt-1">Community Posts</span>
                                </div>
                            </div>
                        )}

                        {activeTab === 'privacy' && (
                            <div className="space-y-6 animate-in fade-in">
                                <h3 className="font-bold text-text-primary dark:text-white border-b border-border dark:border-gray-700 pb-2 flex items-center gap-2"><Ban className="w-5 h-5 text-red-500" /> Blocked Users</h3>
                                {blockedUsers.length === 0 ? (
                                    <p className="text-sm text-text-muted dark:text-gray-500 italic p-4 border border-border dark:border-gray-700 rounded-xl bg-background dark:bg-gray-900/50 text-center">You have not blocked any users.</p>
                                ) : (
                                    <div className="space-y-2 mt-4">
                                        {blockedUsers.map(user => (
                                            <div key={user._id} className="flex items-center justify-between p-3 bg-background dark:bg-gray-900/50 rounded-xl border border-border dark:border-gray-700 transition hover:bg-gray-50 dark:hover:bg-gray-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
                                                        {user.profileImage ? <img src={user.profileImage} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-gray-500" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-text-primary dark:text-white text-sm">{user.name}</h4>
                                                        <p className="text-xs text-text-muted dark:text-gray-500">{user.village || 'No village'} • {user.userType}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleUnblock(user._id)} className="px-3 py-1.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/50 rounded-lg text-sm font-semibold transition-colors border border-green-200 dark:border-green-800/30">Unblock</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
