import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ko from './locales/ko.json';
import ja from './locales/ja.json';
import en from './locales/en.json';

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

// Add custom detector to LanguageDetector
const languageDetector = new LanguageDetector();
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
    fallbackLng: 'en',
    supportedLngs: ['ko', 'ja', 'en'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'customDetector', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'alih-language',
    },
  });

export default i18n;
