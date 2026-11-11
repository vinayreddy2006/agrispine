import React from 'react';
import { useTranslation } from 'react-i18next';
import { PackageOpen, Lightbulb } from 'lucide-react';
import Button from './Button';

const COMMON_EMPTY_MAP = {
  'no items yet': 'ui.empty_title',
  'no crops found': 'ui.no_crops_found',
  'no machines found': 'ui.no_machines_found',
  'no machines available': 'ui.no_machines_found',
  'no machinery listed': 'machinery_ui.no_fleet_title',
  'no data available': 'ui.no_data_available',
  'no matching records found': 'ui.no_matching_records',
  'no conversations yet': 'ui.no_conversations_yet',
  'no messages found': 'chat_ui.no_conversations',
  'no posts yet': 'ui.no_posts_yet',
  'nothing here yet': 'ui.nothing_here_yet',
  'no bookings found': 'ui.no_bookings_found',
  'no bookings on this date': 'calendar.no_bookings_date',
  'no events scheduled': 'ui.no_events_scheduled',
  'no results found': 'ui.no_results_title',
  'no matching results found': 'ui.no_results_title',
  'no expenses recorded': 'crops_ui.no_expenses_title',
  'no government schemes published yet': 'schemes.no_schemes'
};

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

  const resolveText = (text, defaultKey, fallback) => {
    if (!text) return t(defaultKey, fallback);
    const lower = text.toLowerCase().trim();
    if (COMMON_EMPTY_MAP[lower]) {
      return t(COMMON_EMPTY_MAP[lower], text);
    }
    // Check if text is a translation key
    return t(text, text);
  };

  const displayTitle = resolveText(title, 'ui.empty_title', 'No items yet');
  const displayDesc = resolveText(description, 'ui.empty_desc', 'There are no records to display right now.');
  const displayAction = actionText ? resolveText(actionText, actionText, actionText) : null;
  const displaySecondaryAction = secondaryActionText ? resolveText(secondaryActionText, secondaryActionText, secondaryActionText) : null;
  const displayTip = tip ? resolveText(tip, tip, tip) : null;

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

      {displayTip && (
        <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 px-3 py-1.5 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 mb-6 max-w-xs text-left">
          <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{displayTip}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {displayAction && onAction && (
          <Button onClick={onAction} variant="primary" className="shadow-sm">
            {displayAction}
          </Button>
        )}

        {displaySecondaryAction && onSecondaryAction && (
          <Button onClick={onSecondaryAction} variant="outline">
            {displaySecondaryAction}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
