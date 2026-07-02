import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState = ({ message = "Loading...", fullScreen = false }) => {
    
    const containerClasses = fullScreen 
        ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
        : "flex flex-col items-center justify-center p-12 w-full h-full";

    return (
        <div className={containerClasses}>
            <div className="relative flex items-center justify-center mb-4">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                <div className="relative bg-surface p-3 rounded-full shadow-lg border border-border">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            </div>
            <p className="text-text-secondary font-medium animate-pulse">{message}</p>
        </div>
    );
};

export default LoadingState;
