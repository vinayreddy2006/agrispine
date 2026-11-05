import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

import en from '../i18n/translations/en.json';
import hi from '../i18n/translations/hi.json';
import te from '../i18n/translations/te.json';

const translations = { en, hi, te };

const LANGUAGE_KEY = 'agrispine_selected_language';

export const I18nContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key, fallback) => key,
  supportedLanguages: [],
});

export const supportedLanguages = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', flag: '🌾' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
];

export const I18nProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted language from SecureStore
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const saved = await SecureStore.getItemAsync(LANGUAGE_KEY);
        if (saved && translations[saved]) {
          setLanguageState(saved);
        }
      } catch (e) {
        console.log('Failed to load saved language:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSavedLanguage();
  }, []);

  const changeLanguage = async (newLang) => {
    if (!translations[newLang]) return;
    setLanguageState(newLang);
    try {
      await SecureStore.setItemAsync(LANGUAGE_KEY, newLang);
    } catch (e) {
      console.log('Failed to persist language:', e);
    }
  };

  /**
   * Translate a dotted key path (e.g. 'common.save', 'dashboard.my_crops', 'auth.phone')
   */
  const t = useCallback(
    (keyPath, fallback = '') => {
      if (!keyPath) return fallback;

      const keys = keyPath.split('.');
      
      // Look up in active language
      let current = translations[language];
      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          current = undefined;
          break;
        }
      }

      if (typeof current === 'string' && current.trim()) {
        return current;
      }

      // Fallback to English
      let fallbackCurrent = translations.en;
      for (const k of keys) {
        if (fallbackCurrent && typeof fallbackCurrent === 'object' && k in fallbackCurrent) {
          fallbackCurrent = fallbackCurrent[k];
        } else {
          fallbackCurrent = undefined;
          break;
        }
      }

      if (typeof fallbackCurrent === 'string' && fallbackCurrent.trim()) {
        return fallbackCurrent;
      }

      return fallback || keyPath;
    },
    [language]
  );

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage: changeLanguage,
        t,
        supportedLanguages,
        isLoaded,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};

export default I18nContext;

