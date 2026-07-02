import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Landmark, ExternalLink, ChevronDown, ChevronUp, CheckCircle, Info, Calendar, Clock, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translateText } from "../../utils/translateHelper";
import api from "../../utils/api";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

const Schemes = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [expandedId, setExpandedId] = useState(null);
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);

    const Card = ({ children, className = '' }) => (
        <div className={`bg-surface rounded-xl shadow-sm border border-border ${className}`}>
            {children}
        </div>
    );

    const toggleScheme = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    // EFFECT: Fetch & Translate
    useEffect(() => {
        const processSchemes = async () => {
            setLoading(true);
            try {
                // Fetch from real backend
                const { data: rawSchemesData } = await api.get("/admin/schemes");

                const currentLang = i18n.language;

                if (currentLang === 'en') {
                    setSchemes(rawSchemesData);
                    setLoading(false);
                    return;
                }

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
            } catch (err) {
                console.error("Failed to fetch schemes:", err);
            } finally {
                setLoading(false);
            }
        };

        processSchemes();
    }, [i18n.language]);



    return (
        <div className="w-full h-full pb-20">
            <PageHeader 
                title={t('schemes.title', { defaultValue: 'Govt Schemes' })} 
                icon={Landmark} 
            />

            {/* Content */}
            <div className="p-4 space-y-4">

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                        <span className="ml-2 text-gray-500">Translating content...</span>
                    </div>
                ) : schemes.length === 0 ? (
                    <EmptyState 
                        title="No Government Schemes Available" 
                        description="New government schemes will appear here when published." 
                        icon={Landmark}
                    />
                ) : (
                    <div className="space-y-4">
                        {schemes.map((scheme) => (
                            <Card
                                key={scheme._id}
                                className={`transition-all duration-300 overflow-hidden ${expandedId === scheme._id ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'hover:border-primary/50'}`}
                            >

                                {/* Card Header */}
                                <div onClick={() => toggleScheme(scheme._id)} className="p-5 flex justify-between items-start cursor-pointer select-none">
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

                                    <div className={`p-2 rounded-full transition-colors ${expandedId === scheme._id ? 'bg-primary/10 text-primary' : 'text-gray-400'}`}>
                                        {expandedId === scheme._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedId === scheme._id && (
                                    <div className="px-5 pb-6 pt-0 animate-in fade-in slide-in-from-top-1">
                                        <div className="border-t border-border pt-4 space-y-4">

                                            {/* Dates Section */}
                                            <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg border border-primary/20 space-y-3">
                                                <div className="flex gap-3">
                                                    <div className="mt-0.5"><Calendar className="w-4 h-4 text-primary" /></div>
                                                    <div>
                                                        {/* STATIC HEADER: Application Period */}
                                                        <h4 className="font-bold text-gray-700 dark:text-gray-300 text-xs uppercase">{t('schemes.app_period', { defaultValue: 'Application Period' })}</h4>
                                                        {/* DYNAMIC CONTENT */}
                                                        <p className="text-gray-800 dark:text-gray-100 text-sm font-medium">{scheme.applyDate}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <div className="mt-0.5"><Clock className="w-4 h-4 text-primary" /></div>
                                                    <div>
                                                        {/* STATIC HEADER: Expected Payment */}
                                                        <h4 className="font-bold text-gray-700 dark:text-gray-300 text-xs uppercase">{t('schemes.exp_payment', { defaultValue: 'Expected Payment' })}</h4>
                                                        {/* DYNAMIC CONTENT */}
                                                        <p className="text-gray-800 dark:text-gray-100 text-sm font-medium">{scheme.paymentDate}</p>
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
                                                <a href={scheme.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary border border-primary/30 hover:bg-primary/5 font-semibold px-4 py-2 rounded-lg transition text-sm min-h-[44px]">
                                                    {/* STATIC BUTTON TEXT */}
                                                    {t('schemes.website', { defaultValue: 'Official Website' })} <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>

                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>
            
        </div>
    );
};

export default Schemes;
