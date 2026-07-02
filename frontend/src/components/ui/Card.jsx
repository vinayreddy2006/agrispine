import React from 'react';

const Card = ({ children, className = '', hover = false, onClick }) => {
    const baseClasses = "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden";
    const hoverClasses = hover ? "hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer" : "";
    
    return (
        <div 
            className={`${baseClasses} ${hoverClasses} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default Card;
