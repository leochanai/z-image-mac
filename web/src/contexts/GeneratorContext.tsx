"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface GenerationConfig {
  prompt: string;
  negative_prompt: string;
  width: number;
  height: number;
  steps: number;
  guidance: number;
  seed: number;
}

interface GeneratorContextType {
  config: GenerationConfig;
  setConfig: React.Dispatch<React.SetStateAction<GenerationConfig>>;
  isGenerating: boolean;
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>;
  generatedImage: string | null;
  setGeneratedImage: React.Dispatch<React.SetStateAction<string | null>>;
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  updateConfig: (key: keyof GenerationConfig, value: string | number) => void;
}

const GeneratorContext = createContext<GeneratorContextType | undefined>(undefined);

export function GeneratorProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<GenerationConfig>({
    prompt: "",
    negative_prompt: "",
    width: 1024,
    height: 1024,
    steps: 9,
    guidance: 0.0,
    seed: -1,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const updateConfig = (key: keyof GenerationConfig, value: string | number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <GeneratorContext.Provider
      value={{
        config,
        setConfig,
        isGenerating,
        setIsGenerating,
        generatedImage,
        setGeneratedImage,
        showSettings,
        setShowSettings,
        updateConfig,
      }}
    >
      {children}
    </GeneratorContext.Provider>
  );
}

export function useGenerator() {
  const context = useContext(GeneratorContext);
  if (context === undefined) {
    throw new Error("useGenerator must be used within a GeneratorProvider");
  }
  return context;
}
