import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { dictionaries } from "./translations";

const LANG_KEY = "pulseguard-lang";
const LanguageContext = createContext(null);

function readInitialLang() {
  const stored = localStorage.getItem(LANG_KEY);
  return stored === "ar" ? "ar" : "en";
}

function get(obj, path) {
  return path.split(".").reduce((node, key) => (node && typeof node === "object" ? node[key] : undefined), obj);
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readInitialLang);

  const setLang = useCallback((next) => {
    setLangState(next === "ar" ? "ar" : "en");
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((l) => (l === "ar" ? "en" : "ar"));
  }, []);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const t = useCallback(
    (key) => {
      const value = get(dictionaries[lang], key);
      if (value !== undefined) return value;
      const fallback = get(dictionaries.en, key);
      return fallback !== undefined ? fallback : key;
    },
    [lang],
  );

  const dir = lang === "ar" ? "rtl" : "ltr";

  const value = useMemo(() => ({ lang, setLang, toggleLang, t, dir }), [lang, setLang, toggleLang, t, dir]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
