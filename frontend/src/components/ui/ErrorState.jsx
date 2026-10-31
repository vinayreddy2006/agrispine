import React from 'react';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';

/**
 * Reusable ErrorState Component
 * Following Principle 3: Clear explanation, recovery action (Retry), safe navigation, no raw stack traces.
 */
const ErrorState = ({
  title = "Something went wrong",
  message = "We were unable to load this information. Please check your connection and try again.",
  onRetry,
  retryText = "Try Again",
  showHome = true,
  variant = "card", // "card" | "inline" | "full"
  className = "",
}) => {
  const navigate = useNavigate();

  if (variant === "inline") {
    return (
      <div 
        role="alert" 
        className={`p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-3 text-red-800 dark:text-red-300 ${className}`}
      >
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="font-semibold">{title}</p>
          <p className="text-red-700 dark:text-red-300/80 mt-0.5">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/60 dark:hover:bg-red-900 text-red-800 dark:text-red-200 transition-colors flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {retryText}
          </button>
        )}
      </div>
    );
  }

  const containerClasses = variant === "full"
    ? "min-h-[60vh] flex flex-col items-center justify-center p-6 text-center"
    : "p-8 md:p-12 bg-white dark:bg-slate-800 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-xs flex flex-col items-center text-center";

  return (
    <div className={`${containerClasses} ${className}`} role="alert">
      <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 flex items-center justify-center mb-4 text-red-500 shadow-xs">
        <AlertCircle className="w-8 h-8" />
      </div>

      <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-md mb-6 leading-relaxed">
        {message}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="primary"
            className="flex items-center gap-2 !bg-emerald-600 hover:!bg-emerald-700"
          >
            <RefreshCw className="w-4 h-4" />
            {retryText}
          </Button>
        )}
        
        {showHome && (
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="flex items-center gap-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;

