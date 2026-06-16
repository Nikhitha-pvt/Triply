import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../i18n/en.json';
import hi from '../i18n/hi.json';
import te from '../i18n/te.json';
import ta from '../i18n/ta.json';
import kn from '../i18n/kn.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      te: { translation: te },
      ta: { translation: ta },
      kn: { translation: kn },
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values to prevent XSS
    },
  });

export default i18n;
