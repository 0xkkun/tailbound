import { initReactI18next } from 'react-i18next';
import ko from '@i18n/locales/ko.json';
import i18n from 'i18next';

// i18n 초기화
i18n.use(initReactI18next).init({
  resources: {
    ko: {
      translation: ko,
    },
  },
  lng: 'ko', // 기본 언어
  fallbackLng: 'ko', // 폴백 언어
  interpolation: {
    escapeValue: false, // React는 XSS 보호가 기본적으로 되어 있음
  },
});

export default i18n;
