import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe, getLocale, updateUserLanguage } from "../api/client";
import enJson from "../locales/en.json";
import knJson from "../locales/kn.json";
import hiJson from "../locales/hi.json";

const BUNDLED_LOCALES = {
  en: enJson,
  kn: knJson,
  hi: hiJson,
};

const AppContext = createContext({});

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [lang, setLangState] = useState(() => localStorage.getItem("aloemithra_lang") || "en");
  const [theme, setThemeState] = useState(() => localStorage.getItem("aloemithra_theme") || "light");
  const [translations, setTranslations] = useState(() => {
    const saved = localStorage.getItem("aloemithra_lang") || "en";
    return BUNDLED_LOCALES[saved] || enJson;
  });
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Sync theme with DOM & localStorage
  useEffect(() => {
    localStorage.setItem("aloemithra_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      document.body.classList.add("dark-theme");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
      document.body.classList.remove("dark-theme");
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  // Update language state and sync with storage & backend
  const setLang = useCallback((newLang) => {
    const safeLang = BUNDLED_LOCALES[newLang] ? newLang : "en";
    setLangState(safeLang);
    localStorage.setItem("aloemithra_lang", safeLang);
    // Instant synchronous locale update
    setTranslations(BUNDLED_LOCALES[safeLang] || enJson);

    // Optional background sync with backend
    getLocale(safeLang)
      .then((res) => {
        if (res.data && typeof res.data === "object") {
          setTranslations((prev) => ({ ...prev, ...res.data }));
        }
      })
      .catch(() => {});

    if (user) {
      updateUserLanguage(safeLang).catch(() => {});
    }
  }, [user]);

  // Initial load: ensure correct bundled locale
  useEffect(() => {
    const active = BUNDLED_LOCALES[lang] ? lang : "en";
    setTranslations(BUNDLED_LOCALES[active] || enJson);
  }, [lang]);

  // Restore authenticated session on mount
  useEffect(() => {
    getMe()
      .then((r) => {
        if (r.data?.user) {
          const u = r.data.user;
          setUser(u);
          if (u.language && u.language !== lang) {
            const safe = BUNDLED_LOCALES[u.language] ? u.language : "en";
            setLangState(safe);
            localStorage.setItem("aloemithra_lang", safe);
            setTranslations(BUNDLED_LOCALES[safe] || enJson);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAuth(false));
  }, []);

  // Helper translation function
  const t = useCallback((key, fallback = key) => {
    if (translations[key]) {
      // Remove review flag if present for clean UI presentation
      return String(translations[key]).replace(/\s*\[NEEDS_NATIVE_REVIEW\]/g, "").trim();
    }
    return fallback;
  }, [translations]);

  return (
    <AppContext.Provider value={{ user, setUser, lang, setLang, theme, toggleTheme, t, loadingAuth }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
