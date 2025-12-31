"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type Preset = "quick" | "standard" | "hq" | "custom";

interface EditorConfig {
    file: File | null;
    inputPreview: string | null;
    outputImage: string | null;
    prompt: string;
    negativePrompt: string;
    strength: number;
    preset: Preset;
    maxSide: number;
    steps: number;
    guidance: number;
    seed: number;
    isAdvancedOpen: boolean;
}

interface EditorContextType {
    config: EditorConfig;
    setFile: (file: File | null) => void;
    setInputPreview: (preview: string | null) => void;
    setOutputImage: (image: string | null) => void;
    setPrompt: (prompt: string) => void;
    setNegativePrompt: (prompt: string) => void;
    setStrength: (strength: number) => void;
    setPreset: (preset: Preset) => void;
    setMaxSide: (maxSide: number) => void;
    setSteps: (steps: number) => void;
    setGuidance: (guidance: number) => void;
    setSeed: (seed: number) => void;
    setIsAdvancedOpen: (isOpen: boolean) => void;
    resetConfig: () => void;
}

const defaultConfig: EditorConfig = {
    file: null,
    inputPreview: null,
    outputImage: null,
    prompt: "",
    negativePrompt: "",
    strength: 0.6,
    preset: "standard",
    maxSide: 768,
    steps: 25,
    guidance: 1.0,
    seed: -1,
    isAdvancedOpen: false,
};

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<EditorConfig>(defaultConfig);

    const setFile = (file: File | null) => {
        setConfig((prev) => ({ ...prev, file }));
    };

    const setInputPreview = (inputPreview: string | null) => {
        setConfig((prev) => ({ ...prev, inputPreview }));
    };

    const setOutputImage = (outputImage: string | null) => {
        setConfig((prev) => ({ ...prev, outputImage }));
    };

    const setPrompt = (prompt: string) => {
        setConfig((prev) => ({ ...prev, prompt }));
    };

    const setNegativePrompt = (negativePrompt: string) => {
        setConfig((prev) => ({ ...prev, negativePrompt }));
    };

    const setStrength = (strength: number) => {
        setConfig((prev) => ({ ...prev, strength }));
    };

    const setPreset = (preset: Preset) => {
        setConfig((prev) => ({ ...prev, preset }));
    };

    const setMaxSide = (maxSide: number) => {
        setConfig((prev) => ({ ...prev, maxSide }));
    };

    const setSteps = (steps: number) => {
        setConfig((prev) => ({ ...prev, steps }));
    };

    const setGuidance = (guidance: number) => {
        setConfig((prev) => ({ ...prev, guidance }));
    };

    const setSeed = (seed: number) => {
        setConfig((prev) => ({ ...prev, seed }));
    };

    const setIsAdvancedOpen = (isAdvancedOpen: boolean) => {
        setConfig((prev) => ({ ...prev, isAdvancedOpen }));
    };

    const resetConfig = () => {
        setConfig(defaultConfig);
    };

    return (
        <EditorContext.Provider
            value={{
                config,
                setFile,
                setInputPreview,
                setOutputImage,
                setPrompt,
                setNegativePrompt,
                setStrength,
                setPreset,
                setMaxSide,
                setSteps,
                setGuidance,
                setSeed,
                setIsAdvancedOpen,
                resetConfig,
            }}
        >
            {children}
        </EditorContext.Provider>
    );
}

export function useEditor() {
    const context = useContext(EditorContext);
    if (context === undefined) {
        throw new Error("useEditor must be used within an EditorProvider");
    }
    return context;
}
