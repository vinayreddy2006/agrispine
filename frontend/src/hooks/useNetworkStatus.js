import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for network connectivity & slow connection detection
 * Following Principle 4 & 5: Detect offline/slow status, trigger recovery, inform user.
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSlow, setIsSlow] = useState(false);
  const [lastOnlineAt, setLastOnlineAt] = useState(new Date());

  const checkConnectionQuality = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = navigator.connection;
      if (conn) {
        const is2G = conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g';
        const isHighRtt = conn.rtt && conn.rtt > 1500;
        setIsSlow(Boolean(is2G || isHighRtt));
      }
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineAt(new Date());
      checkConnectionQuality();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      navigator.connection?.addEventListener('change', checkConnectionQuality);
      checkConnectionQuality();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (typeof navigator !== 'undefined' && 'connection' in navigator) {
        navigator.connection?.removeEventListener('change', checkConnectionQuality);
      }
    };
  }, [checkConnectionQuality]);

  const testConnection = async () => {
    try {
      // Lightweight fetch to test actual connectivity
      const response = await fetch('/api/health-check-ping', { credentials: 'omit', cache: 'no-store' });
      setIsOnline(true);
      return true;
    } catch {
      // If server ping fails but browser claims online, it could be an intranet/offline scenario
      if (!navigator.onLine) {
        setIsOnline(false);
      }
      return navigator.onLine;
    }
  };

  return {
    isOnline,
    isSlow,
    lastOnlineAt,
    testConnection,
  };
};

export default useNetworkStatus;

