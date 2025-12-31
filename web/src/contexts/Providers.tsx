"use client";

import { type ReactNode } from "react";
import { LocaleProvider } from "./LocaleContext";
import { ThemeProvider } from "./ThemeContext";
import { GeneratorProvider } from "./GeneratorContext";
import { EditorProvider } from "./EditorContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <GeneratorProvider>
          <EditorProvider>
            {children}
          </EditorProvider>
        </GeneratorProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
