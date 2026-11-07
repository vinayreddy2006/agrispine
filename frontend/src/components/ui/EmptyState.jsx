import React from 'react';
import { useTranslation } from 'react-i18next';
import { PackageOpen, Lightbulb } from 'lucide-react';
import Button from './Button';

/**
 * Reusable EmptyState Component
 * Following Principle 1: Explain why it is empty, give actionable next steps, provide primary/secondary actions.
 */
const EmptyState = ({ 
  title, 
  description, 
  tip,
  icon: Icon = PackageOpen, 
  actionText, 
  onAction,
  secondaryActionText,
  onSecondaryAction,
  className = "",
}) => {
  const { t } = useTranslation();
  const displayTitle = title || t('ui.empty_title', 'No items yet');
  const displayDesc = description || t('ui.empty_desc', 'There are no records to display right now.');

  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-6 bg-surface dark:bg-slate-800 rounded-2xl border border-dashed border-border dark:border-slate-700 shadow-xs max-w-lg mx-auto ${className}`}>
      <div className="w-18 h-18 bg-primary/10 dark:bg-primary/20 text-primary rounded-2xl flex items-center justify-center mb-5 shadow-xs">
        <Icon className="w-9 h-9" />
      </div>

      <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">
        {displayTitle}
      </h3>

      <p className="text-text-secondary dark:text-gray-300 text-sm md:text-base max-w-sm mb-4 leading-relaxed">
        {displayDesc}
      </p>

      {tip && (
        <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 px-3 py-1.5 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 mb-6 max-w-xs text-left">
          <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{tip}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionText && onAction && (
          <Button onClick={onAction} variant="primary" className="shadow-sm">
            {actionText}
          </Button>
        )}

        {secondaryActionText && onSecondaryAction && (
          <Button onClick={onSecondaryAction} variant="outline">
            {secondaryActionText}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
