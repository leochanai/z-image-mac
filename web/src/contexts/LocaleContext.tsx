"use client";

import { createContext, useContext, useCallback, useSyncExternalStore, type ReactNode } from "react";
import { locales, type Locale, type Translations } from "@/lib/i18n/locales";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// Locale store for useSyncExternalStore
let currentLocale: Locale = "zh";
const listeners: Set<() => void> = new Set();

function getLocaleSnapshot(): Locale {
  return currentLocale;
}

function getServerSnapshot(): Locale {
  return "zh"; // Default to Chinese on server
}

function subscribeToLocale(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function setLocaleInternal(newLocale: Locale) {
  currentLocale = newLocale;
  if (typeof window !== "undefined") {
    localStorage.setItem("z-image-locale", newLocale);
  }
  listeners.forEach((listener) => listener());
}

// Initialize locale from localStorage (runs once on module load)
if (typeof window !== "undefined") {
  const saved = localStorage.getItem("z-image-locale") as Locale | null;
  if (saved === "zh" || saved === "en") {
    currentLocale = saved;
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribeToLocale, getLocaleSnapshot, getServerSnapshot);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleInternal(newLocale);
  }, []);

  const t = locales[locale];

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
