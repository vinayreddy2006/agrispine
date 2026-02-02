import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UploadCloud, ScanLine, Sprout, AlertTriangle, CheckCircle, Loader2, Leaf, X } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next"; // 1. Import Hook

const PlantDoctor = () => {
    const { t } = useTranslation(); // 2. Initialize Hook
    const navigate = useNavigate();
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    // --- CONFIGURATION ---
    const CLOUD_NAME = "dv2ex5war";
    const UPLOAD_PRESET = "agrispine_upload";

    // --- MOCK AI DATABASE ---
    const diseases = [
        { name: "Early Blight", confidence: 92, cure: "Apply mancozeb or chlorothalonil fungicides. Improve air circulation.", severity: "Moderate", color: "orange" },
        { name: "Leaf Spot", confidence: 88, cure: "Remove infected leaves immediately. Spray neem oil weekly.", severity: "Low", color: "yellow" },
        { name: "Powdery Mildew", confidence: 95, cure: "Use sulfur-based fungicides or a baking soda solution.", severity: "High", color: "red" },
        { name: "Healthy Plant", confidence: 99, cure: "Your plant looks great! Continue regular watering and care.", severity: "None", color: "green" }
    ];

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setResult(null);
        }
    };

    const clearImage = () => {
        setImage(null);
        setPreview(null);
        setResult(null);
    };

    const handleAnalyze = async () => {
        if (!image) return;
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("file", image);
            formData.append("upload_preset", UPLOAD_PRESET);

            await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, formData);

            setTimeout(() => {
                const randomResult = diseases[Math.floor(Math.random() * diseases.length)];
                setResult(randomResult);
                setLoading(false);
            }, 2500);

        } catch (err) {
            console.error(err);
            setLoading(false);
            Swal.fire("Error", "Image upload failed. Check internet.", "error");
        }
    };

    return (
        <div className="w-full">

            {/* Modern Header */}
            <div className="bg-gradient-to-r from-teal-800 to-teal-600 px-6 py-8 pb-12 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                    <Leaf className="w-48 h-48 text-white -mr-10 -mt-10 transform rotate-12" />
                </div>
                <div className="max-w-3xl mx-auto relative z-10 flex items-center gap-4 text-white">
                    <button onClick={() => navigate("/dashboard")} className="p-2 -ml-2 hover:bg-white/20 rounded-full transition backdrop-blur-sm">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            {/* Translated Title */}
                            <Sprout className="w-8 h-8 text-teal-200" /> {t('dashboard.plant_doctor')} <span className="text-sm opacity-70 font-normal">(AI Demo)</span>
                        </h1>
                        <p className="text-teal-100 mt-2 text-sm font-medium opacity-90">
                            {t('doctor.subtitle', { defaultValue: 'Upload a leaf photo for instant disease detection & remedies.' })}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto w-full px-6 -mt-8 relative z-20 flex-1 pb-10">

                {/* Main Content Card */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

                    <div className="p-8">
                        {/* Image Upload Area */}
                        <div className={`w-full h-80 bg-gray-50 rounded-2xl border-3 border-dashed ${preview ? 'border-teal-500' : 'border-gray-300 hover:border-teal-400 hover:bg-teal-50/30'} flex flex-col items-center justify-center overflow-hidden relative group transition-all duration-300`}>
                            {preview ? (
                                <>
                                    <img src={preview} alt="Upload" className="w-full h-full object-cover" />

                                    {/* Clear Button */}
                                    {!loading && (
                                        <button onClick={clearImage} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition">
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}

                                    {/* Scanning Effect */}
                                    {loading && (
                                        <div className="absolute inset-0 bg-teal-900/60 flex flex-col items-center justify-center backdrop-blur-sm">
                                            <ScanLine className="w-20 h-20 text-teal-300 animate-pulse" />
                                            <p className="text-teal-200 font-mono mt-4 font-bold text-lg animate-bounce tracking-wider">
                                                {t('doctor.analyzing', { defaultValue: 'ANALYZING...' })}
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center p-10 pointer-events-none">
                                    <div className="bg-teal-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                                        <UploadCloud className="w-10 h-10 text-teal-600" />
                                    </div>
                                    <p className="text-gray-700 font-bold text-lg">{t('doctor.click_upload', { defaultValue: 'Click or Drag photo here' })}</p>
                                    <p className="text-sm text-gray-500 mt-2">{t('doctor.hint', { defaultValue: 'Clear leaf photos give best results' })}</p>
                                </div>
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                                disabled={loading}
                            />
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleAnalyze}
                            disabled={!image || loading}
                            className={`w-full mt-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl
                   ${!image ? "bg-gray-100 text-gray-400 cursor-not-allowed" :
                                    loading ? "bg-teal-800 text-white cursor-wait" : "bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white active:scale-95"}`}
                        >
                            {loading ?
                                <><Loader2 className="animate-spin w-6 h-6" /> {t('doctor.processing', { defaultValue: 'Processing Image...' })}</>
                                :
                                <><ScanLine className="w-6 h-6" /> {t('doctor.detect_btn', { defaultValue: 'Detect Disease' })}</>
                            }
                        </button>
                    </div>

                    {/* --- RESULT SECTION --- */}
                    {result && (
                        <div className="border-t border-gray-100 animate-in slide-in-from-bottom-4 fade-in duration-500">
                            <div className={`p-6 text-white flex items-center justify-between 
                   ${result.color === 'green' ? 'bg-green-600' :
                                    result.color === 'red' ? 'bg-red-600' :
                                        result.color === 'orange' ? 'bg-orange-500' : 'bg-yellow-500'}`}>
                                <div>
                                    <h3 className="font-bold text-2xl flex items-center gap-3">
                                        {result.color === 'green' ? <CheckCircle className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                                        {result.name}
                                    </h3>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xs opacity-80 uppercase font-bold tracking-wider mb-1">{t('doctor.confidence', { defaultValue: 'AI Confidence' })}</span>
                                    <span className="bg-white/20 px-3 py-1 rounded-full text-lg font-bold backdrop-blur-sm">{result.confidence}%</span>
                                </div>
                            </div>

                            <div className="p-8 bg-gray-50/50">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('doctor.severity', { defaultValue: 'Severity Level' })}</p>
                                        <span className={`inline-block px-4 py-2 rounded-xl text-sm font-bold 
                             ${result.severity === 'High' ? 'bg-red-100 text-red-800' :
                                                result.severity === 'Moderate' ? 'bg-orange-100 text-orange-800' :
                                                    result.severity === 'Low' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                            }`}>
                                            {result.severity}
                                        </span>
                                    </div>
                                    <div className="md:col-span-2 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('doctor.crop_type', { defaultValue: 'Crop Type' })}</p>
                                        <p className="text-gray-800 font-medium flex items-center gap-2">
                                            <Leaf className="w-5 h-5 text-green-500" /> General Leaf Crop
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                    <h4 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                                        <Sprout className="w-6 h-6 text-teal-600" /> {t('doctor.cure', { defaultValue: 'Recommended Action & Cure' })}
                                    </h4>
                                    <p className="text-gray-700 leading-relaxed text-lg bg-teal-50/50 p-5 rounded-xl border border-teal-100">
                                        {result.cure}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
};

export default PlantDoctor;