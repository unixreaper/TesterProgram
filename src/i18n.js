import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import th from "./locales/th.json";

const STORAGE_KEY = "testerDeskLng";
const persistedLanguage =
  typeof globalThis === "undefined" ? null : globalThis.localStorage.getItem(STORAGE_KEY);

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    th: { translation: th }
  },
  lng: persistedLanguage || "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

i18n.on("languageChanged", (lng) => {
  if (globalThis.localStorage) {
    globalThis.localStorage.setItem(STORAGE_KEY, lng);
  }
});

export default i18n;
