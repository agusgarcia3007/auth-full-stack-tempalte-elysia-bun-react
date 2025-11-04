import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import es from "./locales/es.json";
import { enUS, es as esLocale, ptBR } from "date-fns/locale";

export const dateFnsLocales = {
  en: enUS,
  es: esLocale,
  pt: ptBR,
};

const getSavedLanguage = () => {
  if (typeof window !== "undefined" && window.localStorage) {
    return localStorage.getItem("language") || "en";
  }
  return "en";
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: getSavedLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (lng) => {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem("language", lng);
  }
});

export default i18n;
