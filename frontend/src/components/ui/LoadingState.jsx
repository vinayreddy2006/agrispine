import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { CardSkeleton, StatCardSkeleton, PostSkeleton, TableRowSkeleton } from './LoadingSkeleton';

/**
 * LoadingState Component
 * Following Principle 2: Skeletons matching actual content shape instead of raw spinners.
 * Supports skeleton shapes ('card', 'stat', 'post', 'table') or a fallback spinner.
 */
const LoadingState = ({ 
  message, 
  fullScreen = false,
  shape = null, // 'card' | 'stat' | 'post' | 'table' | null
  count = 3,
  className = "",
}) => {
  const { t } = useTranslation();
  const displayMsg = message || t('ui.loading_text', 'Loading information...');

  if (shape === 'card') {
    return <CardSkeleton count={count} />;
  }
  if (shape === 'stat') {
    return <StatCardSkeleton count={count} />;
  }
  if (shape === 'post') {
    return <PostSkeleton count={count} />;
  }
  if (shape === 'table') {
    return <TableRowSkeleton rows={count} />;
  }

  const containerClasses = fullScreen 
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 dark:bg-slate-900/80 backdrop-blur-sm"
    : `flex flex-col items-center justify-center p-12 w-full h-full ${className}`;

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      <div className="relative flex items-center justify-center mb-4">
        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
        <div className="relative bg-surface dark:bg-slate-800 p-3.5 rounded-full shadow-lg border border-border dark:border-slate-700">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
      <p className="text-text-secondary dark:text-gray-300 font-medium text-sm animate-pulse">{displayMsg}</p>
    </div>
  );
};

export default LoadingState;
