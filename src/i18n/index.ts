import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ja from './locales/ja.json';

const LANGUAGE_KEY = 'app_language';

const getInitialLanguage = (): string => {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  if (saved && (saved === 'en' || saved === 'ja')) {
    return saved;
  }
  // デフォルトは英語
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ja: { translation: ja },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export const changeLanguage = (lng: 'en' | 'ja') => {
  i18n.changeLanguage(lng);
  localStorage.setItem(LANGUAGE_KEY, lng);
};

export const getCurrentLanguage = (): 'en' | 'ja' => {
  return i18n.language as 'en' | 'ja';
};

export default i18n;
