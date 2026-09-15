import i18n from 'i18next';

import enTranslation from '../../../locales copy/en/ns1.json';
import frTranslation from '../../../locales copy/fr/ns1.json';
import frNobaTranslation from '../../../locales copy/frnoba/ns1.json';

/**
 * @function getQueryParam
 * @description Retrieves the value of a specified query parameter from the URL. Current options are ?lang=en, ?lang=fr and ?lang=frnoba
 *
 * @param {string} param - The name of the query parameter to retrieve.
 * @returns {string | null} - The value of the query parameter, or null if not found.
 */
export const getQueryParam = (param: string): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

// Initialize i18next
const language = getQueryParam('lang') || 'en'; // Default to 'en' if not specified

i18n.init({
  resources: {
    en: {
      translation: enTranslation,
    },
    fr: {
      translation: frTranslation,
    },
    frnoba: {
      translation: frNobaTranslation,
    },
  },
  lng: language, // Default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already does escaping
  },
});

export default i18n;
