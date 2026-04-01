import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ko from './locales/ko.json';
import ja from './locales/ja.json';
import en from './locales/en.json';

// Query parameter language detector (?lang=ko, ?lang=ja, ?lang=en)
const queryParamDetector = {
  name: 'queryParamDetector',
  lookup() {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    
    if (langParam) {
      // Normalize: jp -> ja
      const normalizedLang = langParam === 'jp' ? 'ja' : langParam;
      if (['ko', 'ja', 'en'].includes(normalizedLang)) {
        // Save to localStorage so subsequent navigation maintains the language
        localStorage.setItem('alih-language', normalizedLang);
        return normalizedLang;
      }
    }
    return null;
  },
  cacheUserLanguage() {
    // Already handled in lookup
  }
};

// Custom language detector that maps browser language to supported languages
const customLanguageDetector = {
  name: 'customDetector',
  lookup() {
    // Check localStorage first
    const savedLang = localStorage.getItem('alih-language');
    if (savedLang && ['ko', 'ja', 'en'].includes(savedLang)) {
      return savedLang;
    }
    
    // Detect from browser language
    const browserLang = navigator.language || (navigator as any).userLanguage;
    if (!browserLang) return 'en';
    
    const langCode = browserLang.toLowerCase();
    
    // Korean region/language detection (ko, ko-KR, etc.)
    if (langCode.startsWith('ko')) {
      return 'ko';
    }
    
    // Japanese region/language detection (ja, ja-JP, etc.)
    if (langCode.startsWith('ja')) {
      return 'ja';
    }
    
    // Default to English for all other regions
    return 'en';
  },
  cacheUserLanguage(lng: string) {
    localStorage.setItem('alih-language', lng);
  }
};

// Add custom detectors to LanguageDetector
const languageDetector = new LanguageDetector();
languageDetector.addDetector(queryParamDetector);
languageDetector.addDetector(customLanguageDetector);

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko: { translation: ko },
      ja: { translation: ja },
      en: { translation: en },
    },
    fallbackLng: 'ko',
    supportedLngs: ['ko', 'ja', 'en'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['queryParamDetector', 'localStorage', 'customDetector', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'alih-language',
    },
  });

export default i18n;
