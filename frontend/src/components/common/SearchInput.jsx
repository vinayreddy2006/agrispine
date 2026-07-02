import React from 'react';
import { Search } from 'lucide-react';

const SearchInput = ({ placeholder, value, onChange, className = "" }) => {
    return (
        <div className={`relative w-full ${className}`}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="w-full !pl-12 pr-4 py-2 border border-border bg-surface text-text-primary rounded-xl focus:ring-2 focus:ring-primary outline-none transition-shadow min-h-[44px]"
            />
        </div>
    );
};

export default SearchInput;
