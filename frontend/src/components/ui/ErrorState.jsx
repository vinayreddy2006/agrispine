import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';

/**
 * Reusable ErrorState Component
 * Following Principle 3: Clear explanation, recovery action (Retry), safe navigation, no raw stack traces.
 */
const ErrorState = ({
  title,
  message,
  onRetry,
  retryText,
  showHome = true,
  variant = "card", // "card" | "inline" | "full"
  className = "",
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const displayTitle = title || t('ui.error_title', 'Something went wrong');
  const displayMessage = message || t('ui.error_desc', 'We were unable to load this information. Please check your connection and try again.');
  const displayRetryText = retryText || t('common.retry', 'Try Again');

  if (variant === "inline") {
    return (
      <div 
        role="alert" 
        className={`p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-3 text-red-800 dark:text-red-300 ${className}`}
      >
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="font-semibold">{displayTitle}</p>
          <p className="text-red-700 dark:text-red-300/80 mt-0.5">{displayMessage}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/60 dark:hover:bg-red-900 text-red-800 dark:text-red-200 transition-colors flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {displayRetryText}
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
      <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 flex items-center justify-center mb-5 text-red-600 dark:text-red-400 shadow-xs">
        <AlertCircle className="w-9 h-9" />
      </div>

      <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {displayTitle}
      </h3>

      <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base max-w-md mb-6 leading-relaxed">
        {displayMessage}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button onClick={onRetry} variant="primary" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            {displayRetryText}
          </Button>
        )}

        {showHome && (
          <Button onClick={() => navigate('/dashboard')} variant="outline" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            {t('nav.home', 'Back to Dashboard')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
