import React from 'react';
import { useTranslation } from 'react-i18next';
import { SearchX, RotateCcw, Lightbulb } from 'lucide-react';
import Button from './Button';

/**
 * Reusable NoSearchResults Component
 * Following Principle 6: Explain no matches, offer search tips, provide Clear Filters action.
 */
const NoSearchResults = ({
  query = '',
  onClear,
  clearText,
  suggestions,
  className = "",
}) => {
  const { t } = useTranslation();
  const displayClearText = clearText || t('ui.reset_search', 'Clear Search & Filters');
  const defaultSuggestions = suggestions || [
    "Check for spelling mistakes in crop or machine names",
    "Try using broader search terms (e.g. 'Tractor' instead of specific model)",
    "Remove or broaden your category, location, or price filters"
  ];

  return (
    <div className={`p-8 md:p-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 text-center max-w-xl mx-auto shadow-xs ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400">
        <SearchX className="w-8 h-8" />
      </div>

      <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
        {query ? (
          <span>{t('ui.no_results_desc', 'No matches found for')} <span className="text-emerald-600 dark:text-emerald-400">"{query}"</span></span>
        ) : (
          t('ui.no_results_title', 'No matching results found')
        )}
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
        {t('ui.no_results_desc', "We couldn't find any records matching your current search criteria or active filters.")}
      </p>

      {/* Helpful tips */}
      {defaultSuggestions && defaultSuggestions.length > 0 && (
        <div className="bg-amber-50/70 dark:bg-slate-900/60 rounded-xl p-4 mb-6 text-left max-w-md mx-auto border border-amber-200/50 dark:border-slate-700/60">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Search suggestions</span>
          </div>
          <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300 list-disc list-inside">
            {defaultSuggestions.map((tip, idx) => (
              <li key={idx} className="leading-relaxed">{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {onClear && (
        <Button onClick={onClear} variant="outline" className="flex items-center gap-2 mx-auto">
          <RotateCcw className="w-4 h-4" />
          {displayClearText}
        </Button>
      )}
    </div>
  );
};

export default NoSearchResults;
