"use client";

import { createContext, useContext, useCallback, useSyncExternalStore, type ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme store for useSyncExternalStore
let currentTheme: Theme = "dark";
const listeners: Set<() => void> = new Set();

function getThemeSnapshot(): Theme {
  return currentTheme;
}

function getServerSnapshot(): Theme {
  return "dark";
}

function subscribeToTheme(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function setThemeInternal(newTheme: Theme) {
  currentTheme = newTheme;
  if (typeof window !== "undefined") {
    localStorage.setItem("z-image-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  }
  listeners.forEach((listener) => listener());
}

// Initialize theme from localStorage (runs once on module load)
if (typeof window !== "undefined") {
  const saved = localStorage.getItem("z-image-theme") as Theme | null;
  currentTheme = saved === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", currentTheme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerSnapshot);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeInternal(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeInternal(currentTheme === "dark" ? "light" : "dark");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
