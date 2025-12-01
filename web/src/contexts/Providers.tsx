"use client";

import { type ReactNode } from "react";
import { LocaleProvider } from "./LocaleContext";
import { ThemeProvider } from "./ThemeContext";
import { GeneratorProvider } from "./GeneratorContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <GeneratorProvider>
          {children}
        </GeneratorProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
