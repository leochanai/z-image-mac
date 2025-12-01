"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, Image as ImageIcon, Send, Settings2, ChevronDown, ChevronUp, Info, Download, RefreshCw, Maximize2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";
import { useSearchParams } from "next/navigation";

interface GenerationConfig {
  prompt: string;
  negative_prompt: string;
  width: number;
  height: number;
  steps: number;
  guidance: number;
  seed: number;
}

// Simple tooltip without portal to avoid SSR issues
const Tooltip = ({ content }: { content: string }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-flex items-center ml-2"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <Info className="w-3.5 h-3.5 text-primary/40 hover:text-primary transition-colors cursor-help" />
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[var(--background)] border border-[var(--border-color)] text-xs text-[var(--foreground-dim)] whitespace-nowrap font-mono z-50"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[var(--border-color)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function Generator() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  
  const [config, setConfig] = useState<GenerationConfig>({
    prompt: "",
    negative_prompt: "",
    width: 1024,
    height: 1024,
    steps: 9,
    guidance: 0.0,
    seed: -1,
  });

  useEffect(() => {
    const prompt = searchParams.get("prompt");
    if (prompt) {
      setConfig(prev => ({
        ...prev,
        prompt: prompt || "",
        negative_prompt: searchParams.get("negative_prompt") || "",
        width: parseInt(searchParams.get("width") || "1024"),
        height: parseInt(searchParams.get("height") || "1024"),
        steps: parseInt(searchParams.get("steps") || "9"),
        guidance: parseFloat(searchParams.get("guidance") || "0.0"),
        seed: parseInt(searchParams.get("seed") || "-1"),
      }));
      
      // Scroll to generator if params are present
      const element = document.getElementById("generator");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [searchParams]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleGenerate = async () => {
    if (!config.prompt) return;
    setIsGenerating(true);
    setGeneratedImage(null);
    
    try {
      const seedToSend = config.seed === -1 ? Math.floor(Math.random() * 2147483647) : config.seed;
      const response = await fetch("http://127.0.0.1:8000/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: config.prompt,
          negative_prompt: config.negative_prompt,
          width: config.width,
          height: config.height,
          steps: config.steps,
          guidance: config.guidance,
          seed: seedToSend,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.url) {
        setGeneratedImage(`http://127.0.0.1:8000${data.url}`);
      }
    } catch (error) {
      console.error("Generation failed:", error);
      alert("Generation failed. Please check the console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateConfig = (key: keyof GenerationConfig, value: string | number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const randomizeSeed = () => {
    updateConfig("seed", Math.floor(Math.random() * 2147483647));
  };

  return (
    <section id="generator" className="min-h-screen py-20 px-6 md:px-12 relative bg-[var(--background)]">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-transparent to-[var(--background)]" />
      
      <div className="container max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="h-[2px] w-12 bg-primary" />
            <span className="font-mono text-xs tracking-widest text-primary">{t.generator.sectionLabel}</span>
          </div>
          <h2 className="font-display text-4xl md:text-6xl tracking-tight text-[var(--foreground)]">
            {t.generator.title} <span className="neon-text">{t.generator.titleHighlight}</span>
          </h2>
        </motion.div>

        {/* Main Layout: Input Panel + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Control Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Main Prompt Input */}
            <div className={cn(
              "relative border-2 transition-all duration-300",
              isGenerating 
                ? "border-primary animate-pulse-neon" 
                : "border-[var(--border-color)] hover:border-[var(--border-hover)]"
            )}>
              {/* Corner decorations */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-primary" />
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-primary" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-primary" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-primary" />
              
              <div className="p-6 bg-[var(--background)]/80">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="font-mono text-xs tracking-widest text-[var(--primary-dim)]">{t.generator.promptLabel}</span>
                </div>
                <textarea
                  value={config.prompt}
                  onChange={(e) => updateConfig("prompt", e.target.value)}
                  placeholder={t.generator.promptPlaceholder}
                  className="w-full h-32 bg-transparent border-none outline-none text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] font-mono text-sm leading-relaxed resize-none"
                  onKeyDown={(e) => e.key === "Enter" && e.metaKey && handleGenerate()}
                />
                <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
                  <span className="font-mono text-xs text-[var(--foreground-muted)]">
                    {config.prompt.length} {t.generator.promptHint}
                  </span>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !config.prompt}
                    className={cn(
                      "font-display text-sm tracking-widest px-6 py-3 transition-all duration-300 flex items-center gap-3",
                      isGenerating || !config.prompt
                        ? "bg-[var(--foreground-muted)]/10 text-[var(--foreground-muted)] cursor-not-allowed"
                        : "bg-primary text-black hover:shadow-[var(--glow-primary)]"
                    )}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        {t.generator.processing}
                      </>
                    ) : (
                      <>
                        {t.generator.generate}
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="border border-[var(--border-color)] bg-[var(--background)]/50">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-[var(--primary-subtle)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings2 className="w-4 h-4 text-[var(--primary-dim)]" />
                  <span className="font-mono text-xs tracking-widest text-[var(--foreground-dim)]">{t.generator.advancedParams}</span>
                </div>
                {showSettings ? (
                  <ChevronUp className="w-4 h-4 text-[var(--primary-dim)]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--primary-dim)]" />
                )}
              </button>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 space-y-4 border-t border-[var(--border-color)]">
                      {/* Negative Prompt */}
                      <div className="pt-4">
                        <div className="flex items-center mb-2">
                          <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)]">{t.generator.negativeLabel}</label>
                          <Tooltip content={t.generator.tooltipNegative} />
                        </div>
                        <input
                          type="text"
                          value={config.negative_prompt}
                          onChange={(e) => updateConfig("negative_prompt", e.target.value)}
                          placeholder={t.generator.negativePlaceholder}
                          className="input-brutal w-full text-sm"
                        />
                      </div>

                      {/* Grid of parameters */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Width */}
                        <div>
                          <div className="flex items-center mb-2">
                            <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)]">{t.generator.widthLabel}</label>
                            <Tooltip content={t.generator.tooltipWidth} />
                          </div>
                          <input
                            type="number"
                            step={16}
                            min={256}
                            value={config.width}
                            onChange={(e) => updateConfig("width", parseInt(e.target.value) || 1024)}
                            onBlur={() => {
                              let val = Math.max(256, config.width);
                              val = Math.round(val / 16) * 16;
                              updateConfig("width", val);
                            }}
                            className="input-brutal w-full text-sm"
                          />
                        </div>

                        {/* Height */}
                        <div>
                          <div className="flex items-center mb-2">
                            <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)]">{t.generator.heightLabel}</label>
                            <Tooltip content={t.generator.tooltipHeight} />
                          </div>
                          <input
                            type="number"
                            step={16}
                            min={256}
                            value={config.height}
                            onChange={(e) => updateConfig("height", parseInt(e.target.value) || 1024)}
                            onBlur={() => {
                              let val = Math.max(256, config.height);
                              val = Math.round(val / 16) * 16;
                              updateConfig("height", val);
                            }}
                            className="input-brutal w-full text-sm"
                          />
                        </div>

                        {/* Steps */}
                        <div>
                          <div className="flex items-center mb-2">
                            <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)]">{t.generator.stepsLabel}</label>
                            <Tooltip content={t.generator.tooltipSteps} />
                          </div>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={config.steps}
                            onChange={(e) => updateConfig("steps", parseInt(e.target.value) || 9)}
                            className="input-brutal w-full text-sm"
                          />
                        </div>

                        {/* Guidance */}
                        <div>
                          <div className="flex items-center mb-2">
                            <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)]">{t.generator.cfgLabel}</label>
                            <Tooltip content={t.generator.tooltipCfg} />
                          </div>
                          <input
                            type="number"
                            step={0.1}
                            value={config.guidance}
                            onChange={(e) => updateConfig("guidance", parseFloat(e.target.value) || 0)}
                            className="input-brutal w-full text-sm"
                          />
                        </div>
                      </div>

                      {/* Seed with randomize */}
                      <div>
                        <div className="flex items-center mb-2">
                          <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)]">{t.generator.seedLabel}</label>
                          <Tooltip content={t.generator.tooltipSeed} />
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={config.seed}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              updateConfig("seed", isNaN(val) ? -1 : val);
                            }}
                            className="input-brutal flex-1 text-sm"
                          />
                          <button
                            onClick={randomizeSeed}
                            className="px-4 border border-[var(--border-color)] hover:border-primary hover:bg-[var(--primary-subtle)] transition-all"
                            title="Randomize seed"
                          >
                            <RefreshCw className="w-4 h-4 text-[var(--primary-dim)]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right: Preview Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative"
          >
            <div className={cn(
              "relative aspect-square border-2 bg-[var(--background)]/80 overflow-hidden transition-all duration-500",
              isGenerating 
                ? "border-primary animate-pulse-neon" 
                : generatedImage 
                  ? "border-[var(--primary-dim)]" 
                  : "border-[var(--border-color)]"
            )}>
              {/* Corner decorations */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[var(--primary-muted)] z-10" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[var(--primary-muted)] z-10" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[var(--primary-muted)] z-10" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[var(--primary-muted)] z-10" />
              
              {/* Scanlines overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-20 scanlines" />
              
              {generatedImage ? (
                <motion.div
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative w-full h-full group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full h-full object-cover"
                  />
                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <a
                      href={generatedImage}
                      download
                      className="p-4 border-2 border-[var(--primary-dim)] hover:border-primary hover:bg-[var(--primary-subtle)] transition-all"
                      title="Download"
                    >
                      <Download className="w-6 h-6 text-primary" />
                    </a>
                    <a
                      href={generatedImage}
                      target="_blank"
                      className="p-4 border-2 border-[var(--primary-dim)] hover:border-primary hover:bg-[var(--primary-subtle)] transition-all"
                      title="Open in new tab"
                    >
                      <Maximize2 className="w-6 h-6 text-primary" />
                    </a>
                  </div>
                </motion.div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {isGenerating ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center"
                    >
                      <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 border-2 border-[var(--primary-muted)] animate-ping" />
                        <div className="absolute inset-2 border-2 border-[var(--primary-dim)] animate-pulse" />
                        <div className="absolute inset-4 border-2 border-primary flex items-center justify-center">
                          <Zap className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <p className="font-mono text-xs tracking-widest text-primary/80">{t.generator.generating}</p>
                      <p className="font-mono text-xs text-[var(--foreground-muted)] mt-2">{t.generator.generatingHint}</p>
                    </motion.div>
                  ) : (
                    <div className="text-center p-8">
                      <div className="w-20 h-20 mx-auto mb-6 border-2 border-dashed border-[var(--border-color)] flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-[var(--primary-muted)]" />
                      </div>
                      <p className="font-mono text-xs tracking-widest text-[var(--foreground-muted)]">{t.generator.outputPreview}</p>
                      <p className="font-mono text-xs text-[var(--foreground-muted)] mt-2">{t.generator.outputHint}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Status bar at bottom */}
              <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-[var(--background)]/80 border-t border-[var(--border-color)]">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-[var(--foreground-muted)]">
                    {config.width}×{config.height} • {config.steps} steps
                  </span>
                  <span className={cn(
                    "flex items-center gap-2",
                    isGenerating ? "text-primary" : generatedImage ? "text-[var(--primary-dim)]" : "text-[var(--foreground-muted)]"
                  )}>
                    <span className={cn(
                      "w-2 h-2",
                      isGenerating ? "bg-primary animate-pulse" : generatedImage ? "bg-primary" : "bg-[var(--foreground-muted)]"
                    )} />
                    {isGenerating ? t.generator.statusProcessing : generatedImage ? t.generator.statusComplete : t.generator.statusIdle}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Noise overlay */}
      <div className="noise-overlay" />
    </section>
  );
}
