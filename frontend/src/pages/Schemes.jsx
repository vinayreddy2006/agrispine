import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Landmark, ExternalLink, ChevronDown, ChevronUp, CheckCircle, Info, Calendar, Clock, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translateText } from "../utils/translateHelper"; // Import the helper

const Schemes = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [expandedId, setExpandedId] = useState(null);
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);

    const toggleScheme = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    // RAW DATA (Simulating Admin/Database Data in English)
    const rawSchemesData = [
        {
            id: 1,
            name: "PM-Kisan Samman Nidhi",
            provider: "Central Govt",
            providerColor: "bg-blue-100 text-blue-700",
            amount: "₹6,000 / year",
            description: "Financial support to land-holding farmers. Amount is transferred in 3 installments of ₹2,000 each.",
            eligibility: "All landholding farmer families (Husband, Wife, Minor Children). Institutional landholders are excluded.",
            applyDate: "Open all year round (Registration required at Agri Office / CSC).",
            paymentDate: "Installments in April-July, Aug-Nov, and Dec-March.",
            link: "https://pmkisan.gov.in/"
        },
        {
            id: 2,
            name: "Rythu Bandhu",
            provider: "Telangana Govt",
            providerColor: "bg-pink-100 text-pink-700",
            amount: "₹10,000 / acre / year",
            description: "Investment support for agriculture to purchase inputs like seeds, fertilizers, and pesticides.",
            eligibility: "Farmers owning land in Telangana with a valid Pattadar Passbook.",
            applyDate: "No Application Needed (Automatic based on Dharani Portal Data).",
            paymentDate: "Kharif: May/June | Rabi: November/December",
            link: "https://rythubandhu.telangana.gov.in/"
        },
        {
            id: 3,
            name: "PM Fasal Bima Yojana",
            provider: "Insurance",
            providerColor: "bg-yellow-100 text-yellow-700",
            amount: "Crop Loss Coverage",
            description: "Insurance coverage against non-preventable natural risks (Drought, Flood, Pests). Premium: 2% (Kharif), 1.5% (Rabi).",
            eligibility: "Farmers including sharecroppers and tenant farmers growing notified crops.",
            applyDate: "Kharif: By July 31st | Rabi: By December 31st",
            paymentDate: "Claims settled after Harvest Assessment (usually 2-3 months after season).",
            link: "https://pmfby.gov.in/"
        },
        {
            id: 4,
            name: "Kisan Credit Card (KCC)",
            provider: "Bank Loan",
            providerColor: "bg-green-100 text-green-700",
            amount: "Low Interest Loan (4%)",
            description: "Short-term credit for cultivation, post-harvest expenses, and consumption requirements of farmer household.",
            eligibility: "All farmers, tenant farmers, and sharecroppers.",
            applyDate: "Anytime at your local Bank Branch.",
            paymentDate: "Loan sanctioned within 14 days of application.",
            link: "https://www.myscheme.gov.in/schemes/kcc"
        }
    ];

    // EFFECT: Translates the Raw Data whenever language changes
    useEffect(() => {
        const processTranslation = async () => {
            setLoading(true);
            const currentLang = i18n.language;

            // If English, just use raw data
            if (currentLang === 'en') {
                setSchemes(rawSchemesData);
                setLoading(false);
                return;
            }

            // If Hindi/Telugu, translate the dynamic fields
            const translatedData = await Promise.all(rawSchemesData.map(async (item) => {
                return {
                    ...item,
                    name: await translateText(item.name, currentLang),
                    provider: await translateText(item.provider, currentLang),
                    amount: await translateText(item.amount, currentLang),
                    description: await translateText(item.description, currentLang),
                    eligibility: await translateText(item.eligibility, currentLang),
                    applyDate: await translateText(item.applyDate, currentLang),
                    paymentDate: await translateText(item.paymentDate, currentLang),
                };
            }));

            setSchemes(translatedData);
            setLoading(false);
        };

        processTranslation();
    }, [i18n.language]);

    return (
        <div className="w-full">

            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-6 pb-12 shadow-md">
                <div className="max-w-4xl mx-auto flex items-center gap-3 text-white">
                    <button onClick={() => navigate("/dashboard")} className="p-2 -ml-2 hover:bg-white/20 rounded-full transition">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    {/* Static Title from Translation JSON */}
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Landmark className="w-7 h-7" /> {t('schemes.title', { defaultValue: 'Govt Schemes' })}
                    </h1>
                </div>
                {/* Static Subtitle from Translation JSON */}
                <p className="max-w-4xl mx-auto text-orange-100 mt-2 text-sm pl-11">
                    {t('schemes.subtitle', { defaultValue: 'Financial aid & schedules' })}
                </p>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 -mt-6">

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                        <span className="ml-2 text-gray-500">Translating content...</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {schemes.map((scheme) => (
                            <div
                                key={scheme.id}
                                className={`bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${expandedId === scheme.id ? 'border-orange-400 ring-1 ring-orange-200 shadow-md' : 'border-gray-200 hover:border-orange-300'}`}
                            >

                                {/* Card Header */}
                                <div onClick={() => toggleScheme(scheme.id)} className="p-5 flex justify-between items-start cursor-pointer select-none">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {/* Dynamic Provider Name */}
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${scheme.providerColor}`}>
                                                {scheme.provider}
                                            </span>
                                        </div>
                                        {/* Dynamic Scheme Name */}
                                        <h3 className="text-lg font-bold text-gray-800">{scheme.name}</h3>
                                        {/* Dynamic Amount */}
                                        <p className="text-green-700 font-bold text-sm mt-1 bg-green-50 inline-block px-2 py-0.5 rounded-md border border-green-100">
                                            💰 {scheme.amount}
                                        </p>
                                    </div>

                                    <div className={`p-2 rounded-full transition-colors ${expandedId === scheme.id ? 'bg-orange-50 text-orange-600' : 'text-gray-400'}`}>
                                        {expandedId === scheme.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedId === scheme.id && (
                                    <div className="px-5 pb-6 pt-0 bg-white animate-in fade-in slide-in-from-top-1">
                                        <div className="border-t border-gray-100 pt-4 space-y-4">

                                            {/* Dates Section */}
                                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 space-y-3">
                                                <div className="flex gap-3">
                                                    <div className="mt-0.5"><Calendar className="w-4 h-4 text-orange-600" /></div>
                                                    <div>
                                                        {/* STATIC HEADER: Application Period */}
                                                        <h4 className="font-bold text-gray-700 text-xs uppercase">{t('schemes.app_period', { defaultValue: 'Application Period' })}</h4>
                                                        {/* DYNAMIC CONTENT */}
                                                        <p className="text-gray-800 text-sm font-medium">{scheme.applyDate}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="mt-0.5"><Clock className="w-4 h-4 text-orange-600" /></div>
                                                    <div>
                                                        {/* STATIC HEADER: Expected Payment */}
                                                        <h4 className="font-bold text-gray-700 text-xs uppercase">{t('schemes.exp_payment', { defaultValue: 'Expected Payment' })}</h4>
                                                        {/* DYNAMIC CONTENT */}
                                                        <p className="text-gray-800 text-sm font-medium">{scheme.paymentDate}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Standard Details */}
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    {/* STATIC HEADER: Details */}
                                                    <h4 className="font-semibold text-gray-500 text-xs uppercase flex items-center gap-1"><Info className="w-3 h-3" /> {t('schemes.details', { defaultValue: 'Details' })}</h4>
                                                    {/* DYNAMIC CONTENT */}
                                                    <p className="text-gray-700 text-sm leading-relaxed">{scheme.description}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    {/* STATIC HEADER: Eligibility */}
                                                    <h4 className="font-semibold text-gray-500 text-xs uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {t('schemes.eligibility', { defaultValue: 'Eligibility' })}</h4>
                                                    {/* DYNAMIC CONTENT */}
                                                    <p className="text-gray-700 text-sm leading-relaxed">{scheme.eligibility}</p>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="pt-2 flex justify-end">
                                                <a href={scheme.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-orange-600 border border-orange-200 hover:bg-orange-50 font-semibold px-4 py-2 rounded-lg transition text-sm">
                                                    {/* STATIC BUTTON TEXT */}
                                                    {t('schemes.website', { defaultValue: 'Official Website' })} <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>

                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Schemes;