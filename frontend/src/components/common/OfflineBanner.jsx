import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertTriangle } from 'lucide-react';
import useNetworkStatus from '../../hooks/useNetworkStatus';

/**
 * Global Offline Banner
 * Following Principle 4 & 5: Clear offline indication, cached status explanation, retry action.
 */
const OfflineBanner = () => {
  const { isOnline, isSlow, lastOnlineAt, testConnection } = useNetworkStatus();
  const [checking, setChecking] = useState(false);
  const [showRestored, setShowRestored] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  const handleRetry = async () => {
    setChecking(true);
    try {
      await testConnection();
    } finally {
      setTimeout(() => setChecking(false), 600);
    }
  };

  if (showRestored) {
    return (
      <div 
        role="status"
        aria-live="polite"
        className="sticky top-0 z-50 w-full bg-emerald-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs md:text-sm transition-all"
      >
        <div className="flex items-center gap-2 max-w-6xl mx-auto w-full">
          <Wifi className="w-4 h-4 shrink-0 text-emerald-200" />
          <span className="font-medium">Internet connection restored. Live data synchronized.</span>
        </div>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div 
        role="alert"
        aria-live="assertive"
        className="sticky top-0 z-50 w-full bg-amber-600 text-white px-4 py-2.5 shadow-md transition-all"
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm">
          <div className="flex items-center gap-2.5">
            <WifiOff className="w-4 h-4 shrink-0 text-amber-200 animate-pulse" />
            <div>
              <span className="font-bold">You are offline.</span>{' '}
              <span className="text-amber-100">Displaying saved data where available. Actions will sync once connected.</span>
            </div>
          </div>
          <button
            onClick={handleRetry}
            disabled={checking}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 active:scale-95 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking...' : 'Check Connection'}
          </button>
        </div>
      </div>
    );
  }

  if (isSlow) {
    return (
      <div 
        role="status"
        className="sticky top-0 z-40 w-full bg-orange-500/95 text-white px-4 py-1.5 text-xs shadow-xs"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-orange-200" />
            <span>Slow network connection detected. Loading optimized previews.</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default OfflineBanner;

