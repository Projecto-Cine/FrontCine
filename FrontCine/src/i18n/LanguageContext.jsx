import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import es from './es';
import en from './en';

const STORAGE_KEY = 'lumen_lang';
const LOCALES = { es: 'es-ES', en: 'en-GB' };
const CATALOGS = { es, en };

function resolve(obj, path) {
  return path.split('.').reduce((acc, k) => acc?.[k], obj);
}

function interpolate(str, params) {
  if (!params || typeof str !== 'string') return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`);
}

function detectLang() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && CATALOGS[stored]) return stored;
  const browser = navigator.language?.slice(0, 2).toLowerCase();
  return CATALOGS[browser] ? browser : 'es';
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectLang);

  const setLang = useCallback((l) => {
    if (!CATALOGS[l]) return;
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  }, []);

  const t = useCallback((path, params) => {
    const str = resolve(CATALOGS[lang], path) ?? resolve(CATALOGS.es, path) ?? path;
    return interpolate(str, params);
  }, [lang]);

  const fmt = useMemo(() => {
    const locale = LOCALES[lang];
    return {
      date:     (d, opts) => new Intl.DateTimeFormat(locale, opts).format(d instanceof Date ? d : new Date(d)),
      time:     (d)       => new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(d instanceof Date ? d : new Date(d)),
      number:   (n, opts) => new Intl.NumberFormat(locale, opts).format(n),
      currency: (n)       => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(n),
      relative: (d)       => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
        Math.round((new Date(d) - Date.now()) / 86400000), 'day'
      ),
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, langs: Object.keys(CATALOGS), setLang, t, fmt }), [lang, setLang, t, fmt]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
