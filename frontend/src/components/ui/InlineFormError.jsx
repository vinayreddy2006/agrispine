import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Reusable InlineFormError Component
 * Following Principle 9: Immediate inline feedback, actionable correction text, accessible markup.
 */
const InlineFormError = ({ error, id }) => {
  if (!error) return null;

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-red-600 dark:text-red-400 animate-fadeIn"
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{error}</span>
    </div>
  );
};

export default InlineFormError;

