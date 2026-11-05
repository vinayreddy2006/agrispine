import React, { createContext, useState, useEffect, useCallback } from 'react';
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  checkStoredSession,
  fetchCurrentUser 
} from '../services/authService';

export const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore stored session on startup
  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const session = await checkStoredSession();
        if (session && isMounted) {
          setToken(session.token);
          setUser(session.user);
          // Silently try refreshing profile to verify token validity
          try {
            const freshUser = await fetchCurrentUser();
            if (isMounted && freshUser) {
              setUser(freshUser);
            }
          } catch {
            // Keep stored user if offline or refresh fails
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Session restore error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (phone, password) => {
    const res = await loginUser(phone, password);
    setToken(res.token);
    setUser(res.user);
    return res;
  }, []);

  const register = useCallback(async (registrationData) => {
    const res = await registerUser(registrationData);
    return res;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setToken(null);
      setUser(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      const freshUser = await fetchCurrentUser();
      setUser(freshUser);
    } catch (err) {
      console.warn('[AuthContext] Refresh profile failed:', err);
    }
  }, [token]);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
