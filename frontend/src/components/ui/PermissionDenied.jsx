import React from 'react';
import { ShieldAlert, Home, ArrowLeft, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';

/**
 * Reusable PermissionDenied Component
 * Following Principle 7: Clear explanation of role/access requirement, safe navigation options.
 */
const PermissionDenied = ({
  title = "Access Restricted",
  message = "You do not have permission to view this resource. This feature may require specific group or owner privileges.",
  requiredRole = null,
  showLogin = false,
  className = "",
}) => {
  const navigate = useNavigate();

  return (
    <div className={`p-8 md:p-14 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 text-center max-w-lg mx-auto shadow-sm ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center mx-auto mb-5 text-amber-600 dark:text-amber-400">
        <ShieldAlert className="w-9 h-9" />
      </div>

      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
        {message}
      </p>

      {requiredRole && (
        <div className="inline-block bg-gray-100 dark:bg-slate-700/60 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-200 mb-6">
          Required Role: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{requiredRole}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {showLogin ? (
          <Button
            onClick={() => navigate('/login')}
            variant="primary"
            className="flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Log In With Authorized Account
          </Button>
        ) : (
          <Button
            onClick={() => navigate('/dashboard')}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </Button>
        )}

        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Button>
      </div>
    </div>
  );
};

export default PermissionDenied;

