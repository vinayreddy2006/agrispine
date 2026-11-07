import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';

const SearchInput = ({ placeholder, value, onChange, className = "" }) => {
    const { t } = useTranslation();
    const displayPlaceholder = placeholder || t('common.search', 'Search...');

    return (
        <div className={`relative w-full ${className}`}>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none shrink-0" />
            <input
                type="text"
                placeholder={displayPlaceholder}
                value={value}
                onChange={onChange}
                className="w-full !pl-11 pr-4 py-2.5 border border-border bg-surface text-text-primary rounded-xl focus:ring-2 focus:ring-primary outline-none transition-shadow text-sm min-h-[44px]"
            />
        </div>
    );
};

export default SearchInput;
