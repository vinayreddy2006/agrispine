import { useState } from "react";
import api from "../../utils/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { 
    Tractor, ArrowLeft, UploadCloud, Loader2, Image as ImageIcon, 
    Plus, Trash2, CheckCircle2, Sparkles, DollarSign, Wrench, 
    Layers, Tag, Info, ShieldCheck, Calendar, Clock
} from "lucide-react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import PageHeader from "../../components/common/PageHeader";
import InlineFormError from "../../components/ui/InlineFormError";

// Preset operation templates common in rural agriculture (e.g. Telangana, Andhra, Maharashtra, Punjab)
const SUGGESTED_OPERATIONS = [
    { name: "Cultivator", defaultPrice: 800, priceUnit: "acre" },
    { name: "7 Nagallu (7-Tyne Cultivator)", defaultPrice: 900, priceUnit: "acre" },
    { name: "Pedda Nagallu (Deep Ploughing)", defaultPrice: 1200, priceUnit: "acre" },
    { name: "Pathi Katta Pikadam (Cotton Root Pulling)", defaultPrice: 1100, priceUnit: "acre" },
    { name: "Rotavator (Soil Pulverization)", defaultPrice: 1000, priceUnit: "acre" },
    { name: "Seed Drilling & Sowing", defaultPrice: 850, priceUnit: "acre" },
    { name: "Laser Land Leveling", defaultPrice: 1200, priceUnit: "hour" },
    { name: "Paddy Harvesting & Threshing", defaultPrice: 2400, priceUnit: "acre" },
    { name: "Spraying (Drone / Boom)", defaultPrice: 450, priceUnit: "acre" },
    { name: "Trolley Transport", defaultPrice: 700, priceUnit: "hour" }
];

const MACHINE_CATEGORIES = [
    "Tractor", "Harvester", "Rotavator", "Drone", "JCB", 
    "Rice Planter", "Dozer", "Baler", "Ridger", "Power Tiller"
];

const AddMachine = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(null);

    // Configuration for Cloudinary
    const CLOUD_NAME = "dv2ex5war";
    const UPLOAD_PRESET = "agrispine_upload";

    const [formData, setFormData] = useState({
        name: "",
        type: "Tractor",
        price: "",
        priceUnit: "hour",
        condition: "Good",
        modelYear: new Date().getFullYear(),
        specs: "",
        description: "",
        image: ""
    });

    // Agricultural operations / tasks list
    const [tasks, setTasks] = useState([
        { name: "Cultivator", price: "900", priceUnit: "acre", description: "Standard field tilling", available: true },
        { name: "Pedda Nagallu", price: "1200", priceUnit: "acre", description: "Deep subsoil plowing", available: true }
    ]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    // Task management
    const handleAddTask = () => {
        setTasks([
            ...tasks,
            { name: "", price: formData.price || "800", priceUnit: formData.priceUnit || "hour", description: "", available: true }
        ]);
    };

    const handleAddPresetTask = (preset) => {
        if (tasks.some(t => t.name.toLowerCase() === preset.name.toLowerCase())) {
            return; // already added
        }
        setTasks([
            ...tasks,
            { name: preset.name, price: String(preset.defaultPrice), priceUnit: preset.priceUnit, description: "", available: true }
        ]);
    };

    const handleRemoveTask = (index) => {
        setTasks(tasks.filter((_, idx) => idx !== index));
    };

    const handleTaskChange = (index, field, value) => {
        const updated = [...tasks];
        updated[index][field] = value;
        setTasks(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Please enter a machine title or model name (e.g. Mahindra 575 DI)';
        }
        if (!formData.price || Number(formData.price) <= 0) {
            newErrors.price = 'Please specify a valid base rental rate greater than ₹0';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            let imageUrl = formData.image;

            // Upload image to Cloudinary if selected
            if (imageFile) {
                const data = new FormData();
                data.append("file", imageFile);
                data.append("upload_preset", UPLOAD_PRESET);

                const response = await axios.post(
                    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                    data
                );
                imageUrl = response.data.secure_url;
            }

            // Fallback category image if no image provided
            if (!imageUrl) {
                const cat = (formData.type || 'tractor').toLowerCase();
                imageUrl = `/machines/${cat === 'harvester' ? 'harvestor' : cat}.png`;
            }

            const payload = {
                ...formData,
                price: Number(formData.price),
                modelYear: formData.modelYear ? Number(formData.modelYear) : undefined,
                image: imageUrl,
                tasks: tasks
                    .filter(t => t.name && t.name.trim())
                    .map(t => ({
                        name: t.name.trim(),
                        price: Number(t.price) || Number(formData.price),
                        priceUnit: t.priceUnit || formData.priceUnit,
                        description: t.description || "",
                        available: t.available !== false
                    }))
            };

            await api.post("/machines/add", payload);

            await Swal.fire({
                title: 'Machine Listed! 🚜',
                text: 'Your agricultural machine and custom operations are now visible to farmers.',
                icon: 'success',
                confirmButtonColor: '#16a34a'
            });

            navigate("/rent/list/all");

        } catch (err) {
            console.error(err);
            Swal.fire({
                title: 'Listing Failed',
                text: err.response?.data?.message || 'Could not list machine. Please check details and try again.',
                icon: 'error',
                confirmButtonColor: '#d33'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
            <PageHeader 
                title="Add Machinery for Rent"
                icon={Tractor}
                backTo="/rent/list/all"
            />

            <div className="max-w-4xl mx-auto px-4 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* Section 1: Basic Information */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                                1
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Basic Machine Information</h2>
                                <p className="text-xs text-slate-500">Provide the model name, machinery category, and condition</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Machine Name / Title *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Mahindra 575 DI Sarpanch"
                                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.name ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500'} rounded-xl text-sm focus:ring-2 focus:bg-white outline-none`}
                                />
                                <InlineFormError error={errors.name} />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Machine Category *
                                </label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                                >
                                    {MACHINE_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Machine Condition
                                </label>
                                <select
                                    name="condition"
                                    value={formData.condition}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="Excellent">Excellent (Like New)</option>
                                    <option value="Good">Good (Well Maintained)</option>
                                    <option value="Fair">Fair (Working Order)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Model / Registration Year
                                </label>
                                <input
                                    type="number"
                                    name="modelYear"
                                    min="1990"
                                    max={new Date().getFullYear() + 1}
                                    value={formData.modelYear}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Base Pricing */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                                2
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Base Rental Rate</h2>
                                <p className="text-xs text-slate-500">Default base rate if no specific custom task is booked</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Base Price (₹) *
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    required
                                    min="1"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="e.g. 750"
                                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border ${errors.price ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500'} rounded-xl text-sm focus:ring-2 outline-none`}
                                />
                                <InlineFormError error={errors.price} />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Base Unit *
                                </label>
                                <select
                                    name="priceUnit"
                                    value={formData.priceUnit}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="hour">Per Hour</option>
                                    <option value="acre">Per Acre</option>
                                    <option value="day">Per Day</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Agricultural Tasks / Services */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                                    3
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Agricultural Tasks & Operations</h2>
                                    <p className="text-xs text-slate-500">Specify custom operations (e.g. 7 Nagallu, Pedda Nagallu, Cultivator) with agreed rates</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleAddTask}
                                className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 transition"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Custom Operation</span>
                            </button>
                        </div>

                        {/* Quick Presets */}
                        <div className="mb-6">
                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Quick Suggestions (Click to Add):
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {SUGGESTED_OPERATIONS.map((preset) => {
                                    const isAdded = tasks.some(t => t.name.toLowerCase() === preset.name.toLowerCase());
                                    return (
                                        <button
                                            key={preset.name}
                                            type="button"
                                            onClick={() => handleAddPresetTask(preset)}
                                            disabled={isAdded}
                                            className={`text-xs px-3 py-1.5 rounded-full border transition flex items-center gap-1 ${
                                                isAdded 
                                                    ? 'bg-emerald-100/70 border-emerald-300 text-emerald-800 cursor-default opacity-80' 
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            {isAdded && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                            <span>{preset.name}</span>
                                            <span className="text-slate-400 font-semibold">(₹{preset.defaultPrice}/{preset.priceUnit})</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Configured Tasks List */}
                        <div className="space-y-3">
                            {tasks.map((task, idx) => (
                                <div 
                                    key={idx} 
                                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center gap-3"
                                >
                                    <div className="flex-1 w-full">
                                        <input
                                            type="text"
                                            placeholder="Operation Name (e.g. Cultivator, 7 Nagallu)"
                                            value={task.name}
                                            onChange={(e) => handleTaskChange(idx, "name", e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>

                                    <div className="w-full md:w-36 flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2">
                                        <span className="text-xs text-slate-400 font-bold mr-1">₹</span>
                                        <input
                                            type="number"
                                            placeholder="Rate"
                                            value={task.price}
                                            onChange={(e) => handleTaskChange(idx, "price", e.target.value)}
                                            className="w-full py-2 bg-transparent text-sm font-bold outline-none"
                                        />
                                    </div>

                                    <div className="w-full md:w-36">
                                        <select
                                            value={task.priceUnit}
                                            onChange={(e) => handleTaskChange(idx, "priceUnit", e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="acre">Per Acre</option>
                                            <option value="hour">Per Hour</option>
                                            <option value="day">Per Day</option>
                                        </select>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTask(idx)}
                                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition self-end md:self-center"
                                        title="Remove Operation"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 4: Specifications & Details */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                                4
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Specifications & Description</h2>
                                <p className="text-xs text-slate-500">Highlight horsepower, attachments available, fuel type, and terms</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Technical Specs (HP, Attachments, Fuel)
                                </label>
                                <input
                                    type="text"
                                    name="specs"
                                    value={formData.specs}
                                    onChange={handleChange}
                                    placeholder="e.g. 45 HP, Dual Clutch, Hydraulic Power Steering, 2WD"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Description & Operator Details
                                </label>
                                <textarea
                                    name="description"
                                    rows="3"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="e.g. Experienced driver included. Diesel included in hourly rate. Available within 25 km radius."
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 5: Machine Photos */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                                5
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Machine Photo</h2>
                                <p className="text-xs text-slate-500">Upload a real photo of your machinery to get more bookings</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="w-full md:w-1/2">
                                <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50 dark:bg-slate-800/40">
                                    <UploadCloud className="w-10 h-10 text-emerald-600 mb-2" />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Click to Upload Photo</span>
                                    <span className="text-xs text-slate-400 mt-1">PNG, JPG or WEBP up to 10MB</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <div className="w-full md:w-1/2 flex items-center justify-center">
                                {preview ? (
                                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 w-full h-44 bg-slate-100 dark:bg-slate-800">
                                        <img src={preview} alt="Machine Preview" className="w-full h-full object-cover" />
                                        <span className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/70 text-white text-[11px] font-semibold rounded-lg">
                                            Selected Photo
                                        </span>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 w-full h-44 flex flex-col items-center justify-center text-slate-400">
                                        <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                        <span className="text-xs">Standard category image will be used if none uploaded</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="flex items-center justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate("/rent/list/all")}
                            className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Listing Machine...</span>
                                </>
                            ) : (
                                <>
                                    <Tractor className="w-5 h-5" />
                                    <span>Publish Machinery Listing</span>
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default AddMachine;
