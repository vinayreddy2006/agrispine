import React from 'react';

const Button = ({ 
    children, 
    onClick, 
    variant = 'primary', 
    type = 'button', 
    disabled = false, 
    className = '',
    fullWidth = false,
    icon: Icon
}) => {
    
    const baseClasses = "font-bold px-6 py-3 rounded-xl transition shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]";
    
    const variants = {
        primary: "bg-primary hover:bg-primary-hover text-white",
        secondary: "bg-surface hover:bg-gray-50 dark:hover:bg-gray-800 text-text-primary border border-border",
        danger: "bg-red-600 hover:bg-red-700 text-white",
        ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary shadow-none"
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
        <button 
            type={type} 
            onClick={onClick} 
            disabled={disabled}
            className={`${baseClasses} ${variants[variant]} ${widthClass} ${className}`}
        >
            {Icon && <Icon className="w-5 h-5" />}
            {children}
        </button>
    );
};

export default Button;
