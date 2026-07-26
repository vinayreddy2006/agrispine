import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, ChevronDown } from "lucide-react";

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const languages = [
        { code: 'en', label: 'English', short: 'EN' },
        { code: 'hi', label: 'हिन्दी', short: 'HI' },
        { code: 'te', label: 'తెలుగు', short: 'TE' }
    ];

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng).then(() => {
            window.location.reload();
        });
        setIsOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const activeLang = languages.find(l => l.code === i18n.language) || languages[0];

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 transition-colors shadow-sm min-h-[44px]"
            >
                <Globe className="w-4 h-4 text-green-600 dark:text-green-500" />
                <span className="text-sm font-bold">{activeLang.short}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-lg w-32 overflow-hidden z-50 py-1 animate-in fade-in slide-in-from-top-2">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors min-h-[44px] flex items-center justify-between
                                ${i18n.language === lang.code ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                            {lang.label}
                            {i18n.language === lang.code && <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;