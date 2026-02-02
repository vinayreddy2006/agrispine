import React from "react";
import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="flex gap-2 bg-white/50 p-1 rounded-lg backdrop-blur-sm border border-gray-200">
            <button onClick={() => changeLanguage('en')} className={`px-2 py-1 rounded text-xs font-bold ${i18n.language === 'en' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Eng</button>
            <button onClick={() => changeLanguage('hi')} className={`px-2 py-1 rounded text-xs font-bold ${i18n.language === 'hi' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>हिंदी</button>
            <button onClick={() => changeLanguage('te')} className={`px-2 py-1 rounded text-xs font-bold ${i18n.language === 'te' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>తెలుగు</button>
        </div>
    );
};

export default LanguageSwitcher;