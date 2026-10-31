import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Landmark, ExternalLink, ChevronDown, ChevronUp, CheckCircle, Info, Calendar, Clock, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translateText } from "../../utils/translateHelper";
import api from "../../utils/api";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import NoSearchResults from "../../components/ui/NoSearchResults";
import { CardSkeleton } from "../../components/ui/LoadingSkeleton";
import SearchInput from "../../components/common/SearchInput";

const Schemes = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [expandedId, setExpandedId] = useState(null);
    const [schemes, setSchemes] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const Card = ({ children, className = '' }) => (
        <div className={`bg-surface dark:bg-slate-800 rounded-xl shadow-xs border border-border dark:border-slate-700 ${className}`}>
            {children}
        </div>
    );

    const toggleScheme = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const processSchemes = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch from real backend
            const { data: rawSchemesData } = await api.get("/admin/schemes");

            const currentLang = i18n.language;

            if (currentLang === 'en') {
                setSchemes(rawSchemesData);
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
            setError("Could not load government schemes. Please verify your connection.");
        } finally {
            setLoading(false);
        }
    };

    // EFFECT: Fetch & Translate
    useEffect(() => {
        processSchemes();
    }, [i18n.language]);

    const filteredSchemes = schemes.filter(s => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (s.name || "").toLowerCase().includes(q) ||
               (s.provider || "").toLowerCase().includes(q) ||
               (s.amount || "").toLowerCase().includes(q) ||
               (s.description || "").toLowerCase().includes(q);
    });

    return (
        <div className="w-full h-full pb-20">
            <PageHeader 
                title={t('schemes.title', { defaultValue: 'Govt Schemes' })} 
                icon={Landmark} 
            />

            {/* Content */}
            <div className="p-4 space-y-4 max-w-5xl mx-auto">
                {/* Search Bar */}
                <SearchInput 
                    placeholder="Search government schemes by name, provider or benefit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                {loading ? (
                    <CardSkeleton count={3} />
                ) : error ? (
                    <ErrorState
                        title="Unable to Load Schemes"
                        message={error}
                        onRetry={processSchemes}
                    />
                ) : searchTerm && filteredSchemes.length === 0 ? (
                    <NoSearchResults
                        query={searchTerm}
                        onClear={() => setSearchTerm("")}
                        suggestions={[
                            "Search for major schemes like Rythu Bandhu, PM-Kisan, or Drip Irrigation",
                            "Search by authority like Central Government or State Agriculture Department",
                            "Clear your search query to view all active farmer support programs"
                        ]}
                    />
                ) : schemes.length === 0 ? (
                    <EmptyState 
                        title="No Government Schemes Published Yet" 
                        description="Verified state and central agricultural subsidy programs will appear here with application deadlines and direct portals."
                        tip="AgriSpine synchronizes official DBT and subsidy announcements directly from government gazettes."
                        icon={Landmark}
                        actionText="Refresh Schemes"
                        onAction={processSchemes}
                    />
                ) : (
                    <div className="space-y-4">
                        {filteredSchemes.map((scheme) => (
                            <Card
                                key={scheme._id}
                                className="transition-all duration-200 hover:shadow-md border-l-4 border-l-orange-500 overflow-hidden"
                            >
                                <div
                                    onClick={() => toggleScheme(scheme._id)}
                                    className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300">
                                                {scheme.provider}
                                            </span>
                                            {scheme.status && (
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${scheme.status === 'Active' ? 'bg-green-100 dark:bg-emerald-950/60 text-green-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
                                                    {scheme.status}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                            {scheme.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{scheme.description}</p>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0">
                                        <div className="text-left md:text-right">
                                            <span className="text-xs text-gray-400 block">{t('schemes.financial_benefit', { defaultValue: 'Financial Benefit' })}</span>
                                            <span className="text-lg font-bold text-green-600 dark:text-green-400">{scheme.amount}</span>
                                        </div>
                                        <div className="text-gray-400">
                                            {expandedId === scheme._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {expandedId === scheme._id && (
                                    <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-slate-700/60 bg-gray-50/50 dark:bg-slate-900/40 space-y-4">
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('schemes.about', { defaultValue: 'About the Scheme' })}</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{scheme.description}</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                    <CheckCircle className="w-3.5 h-3.5 text-green-500" /> {t('schemes.eligibility', { defaultValue: 'Eligibility Criteria' })}
                                                </h4>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{scheme.eligibility}</p>
                                            </div>

                                            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700 space-y-2">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-orange-500" /> {t('schemes.important_timeline', { defaultValue: 'Important Timeline' })}
                                                </h4>
                                                <div className="flex justify-between text-sm py-1 border-b border-gray-50 dark:border-slate-700">
                                                    <span className="text-gray-500 dark:text-gray-400">{t('schemes.application_window', { defaultValue: 'Application Window' })}:</span>
                                                    <span className="font-medium text-gray-800 dark:text-gray-200">{scheme.applyDate || 'Always Open'}</span>
                                                </div>
                                                <div className="flex justify-between text-sm py-1">
                                                    <span className="text-gray-500 dark:text-gray-400">{t('schemes.disbursement_window', { defaultValue: 'Disbursement Window' })}:</span>
                                                    <span className="font-medium text-gray-800 dark:text-gray-200">{scheme.paymentDate || 'Direct Benefit Transfer (DBT)'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2 flex justify-end">
                                            <a
                                                href={scheme.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition active:scale-95"
                                            >
                                                <span>{t('schemes.apply_official', { defaultValue: 'Apply on Official Portal' })}</span>
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
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
