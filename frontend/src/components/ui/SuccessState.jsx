import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ArrowRight, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';

/**
 * Reusable SuccessState Component
 * Following Principle 10: Explicit confirmation, clear record summary, actionable next steps.
 */
const SuccessState = ({
  title,
  message,
  primaryAction = null, // { label: string, onClick: func, icon: Component }
  secondaryAction = null,
  referenceId = null,
  referenceLabel,
  className = "",
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const displayTitle = title || t('ui.success_title', 'Action Completed Successfully');
  const displayMessage = message || t('ui.action_completed', 'Your request has been processed and saved.');
  const displayRefLabel = referenceLabel || t('ui.reference_number', 'Reference ID');

  return (
    <div className={`p-8 md:p-12 bg-white dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-center max-w-lg mx-auto shadow-sm ${className}`}>
      <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center mx-auto mb-5 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-10 h-10 animate-scaleIn" />
      </div>

      <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {displayTitle}
      </h3>

      <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
        {displayMessage}
      </p>

      {referenceId && (
        <div className="inline-block bg-emerald-50 dark:bg-slate-700/60 border border-emerald-100 dark:border-slate-600 px-4 py-2 rounded-xl text-xs font-mono font-medium text-emerald-800 dark:text-emerald-300 mb-6">
          {displayRefLabel}: <span className="font-bold">{referenceId}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {primaryAction ? (
          <Button
            onClick={primaryAction.onClick}
            variant="primary"
            className="flex items-center gap-2"
          >
            {primaryAction.icon ? <primaryAction.icon className="w-4 h-4" /> : null}
            {primaryAction.label}
          </Button>
        ) : (
          <Button
            onClick={() => navigate('/dashboard')}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            {t('ui.view_dashboard', 'Back to Dashboard')}
          </Button>
        )}

        {secondaryAction && (
          <Button
            onClick={secondaryAction.onClick}
            variant="outline"
            className="flex items-center gap-2"
          >
            {secondaryAction.label}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SuccessState;
