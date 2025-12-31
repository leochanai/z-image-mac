"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, Image as ImageIcon, Send, Settings2, ChevronDown, ChevronUp, Info, Download, RefreshCw, Maximize2, RectangleHorizontal, Square as SquareIcon, RectangleVertical, Check, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";
import { useGenerator } from "@/contexts/GeneratorContext";
import { useSearchParams } from "next/navigation";

type HistoryItem = {
  url: string;
  prompt: string;
  timestamp: number;
};

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
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[var(--background)] border border-[var(--border-color)] text-xs text-[var(--foreground-dim)] w-max max-w-[200px] text-center font-mono z-50"
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

  const {
    config,
    setConfig,
    isGenerating,
    setIsGenerating,
    generatedImage,
    setGeneratedImage,
    showSettings,
    setShowSettings,
    updateConfig
  } = useGenerator();

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

  const [overflowVisible, setOverflowVisible] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobPosition, setJobPosition] = useState<number | null>(null);

  // Track the latest job ID to ensure the UI only updates for the most recent request
  const latestJobId = useRef<string | null>(null);

  const handleGenerate = async () => {
    if (!config.prompt) return;

    setIsSubmitting(true);
    setIsGenerating(true);
    setGeneratedImage(null);
    setJobStatus("queued");
    setShowSuccess(false);

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
      const jobId = data.job_id;
      latestJobId.current = jobId;

      // Show success confirmation
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);

      // Allow submitting next request immediately
      setIsSubmitting(false);

      // Poll for status
      const pollInterval = setInterval(async () => {
        // If this is no longer the latest job, stop polling for UI updates (but let it finish in background if needed? 
        // Actually, for this simple app, we can just stop polling here. The global queue poller will show it in the list.)
        if (latestJobId.current !== jobId) {
          clearInterval(pollInterval);
          return;
        }

        try {
          const statusRes = await fetch(`http://127.0.0.1:8000/api/job/${jobId}`);
          if (!statusRes.ok) throw new Error("Failed to fetch job status");

          const statusData = await statusRes.json();

          // Double check we are still the active job before updating state
          if (latestJobId.current !== jobId) {
            clearInterval(pollInterval);
            return;
          }

          setJobStatus(statusData.status);
          setJobPosition(statusData.position);

          if (statusData.status === "completed") {
            clearInterval(pollInterval);
            if (statusData.result && statusData.result.url) {
              setGeneratedImage(`http://127.0.0.1:8000${statusData.result.url}`);
            }
            setIsGenerating(false);
            setJobStatus(null);
          } else if (statusData.status === "failed") {
            clearInterval(pollInterval);
            setIsGenerating(false);
            setJobStatus(null);
            alert(`Generation failed: ${statusData.error}`);
          }
        } catch (error) {
          console.error("Polling error:", error);
          clearInterval(pollInterval);
          setIsGenerating(false);
          setJobStatus(null);
        }
      }, 1000);

    } catch (error) {
      console.error("Generation failed:", error);
      alert("Generation failed. Please check the console for details.");
      setIsGenerating(false);
      setIsSubmitting(false);
      setJobStatus(null);
    }
  };

  const handleOptimize = async () => {
    if (!config.prompt) return;

    setIsOptimizing(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: config.prompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.optimized_prompt) {
        updateConfig("prompt", data.optimized_prompt);
      }
    } catch (error) {
      console.error("Optimization failed:", error);
      alert("Optimization failed. Make sure Ollama is running locally.");
    } finally {
      setIsOptimizing(false);
    }
  };



  const randomizeSeed = () => {
    updateConfig("seed", Math.floor(Math.random() * 2147483647));
  };

  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Update history when a job completes
  useEffect(() => {
    if (jobStatus === "completed" && generatedImage) {
      // Avoid duplicates
      setHistory(prev => {
        const exists = prev.some(h => h.url === generatedImage);
        if (exists) return prev;
        return [{ url: generatedImage, prompt: config.prompt, timestamp: Date.now() }, ...prev];
      });
    }
  }, [jobStatus, generatedImage]);

  return (
    <section id="generator" className="min-h-screen py-20 px-6 md:px-12 relative bg-[var(--background)]">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-transparent to-[var(--background)]" />

      <div className="container max-w-[1600px] mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="h-[2px] w-12 bg-primary" />
            <span className="font-mono text-xs tracking-widest text-primary">{t.generator.sectionLabel}</span>
          </div>
          <h2 className="font-display text-4xl md:text-6xl tracking-tight text-[var(--foreground)]">
            {t.generator.title} <span className="neon-text">{t.generator.titleHighlight}</span>
          </h2>
        </motion.div>

        {/* Main Layout: Image-First Design - Preview Left (60%), Controls Right (40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-[6fr_4fr] gap-6">

          {/* LEFT: Image Preview Area (Primary Focus - 60%) */}
          <div className="flex flex-col gap-3">
            {/* Preview Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-1"
            >
              <div className={cn(
                "relative h-[600px] w-full border-2 bg-[var(--background)]/80 overflow-hidden transition-all duration-500",
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
                      className="w-full h-full object-contain bg-black/50"
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
                        <div className="relative w-24 h-24 mx-auto mb-6">
                          <motion.div
                            className="absolute inset-0 border-2 border-primary rounded-lg"
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.5, 0, 0.5]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <motion.div
                            className="absolute inset-2 border border-primary-dim rounded-md"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          />
                          <div className="absolute inset-4 flex items-center justify-center bg-primary/10 rounded">
                            <Zap className="w-8 h-8 text-primary animate-pulse" />
                          </div>
                        </div>
                        <p className="font-mono text-sm tracking-widest text-primary">
                          {jobStatus === "queued"
                            ? `QUEUED (POS: ${jobPosition})`
                            : t.generator.generating}
                        </p>
                        <p className="font-mono text-xs text-[var(--foreground-muted)] mt-2">{t.generator.generatingHint}</p>
                      </motion.div>
                    ) : (
                      <div className="text-center p-8">
                        <motion.div
                          className="w-24 h-24 mx-auto mb-6 border-2 border-dashed border-[var(--border-color)] flex items-center justify-center"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <ImageIcon className="w-10 h-10 text-[var(--primary-muted)]" />
                        </motion.div>
                        <p className="font-mono text-sm tracking-widest text-[var(--foreground-dim)]">{t.generator.outputPreview}</p>
                        <p className="font-mono text-xs text-[var(--foreground-muted)] mt-2">{t.generator.outputHint}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Status bar at bottom */}
                <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-[var(--background)]/90 border-t border-[var(--border-color)] backdrop-blur-sm">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-[var(--foreground-muted)]">
                      {config.width}×{config.height} • {config.steps} steps
                    </span>
                    <span className={cn(
                      "flex items-center gap-2",
                      isGenerating ? "text-primary" : generatedImage ? "text-[var(--primary-dim)]" : "text-[var(--foreground-muted)]"
                    )}>
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        isGenerating ? "bg-primary animate-pulse" : generatedImage ? "bg-primary" : "bg-[var(--foreground-muted)]"
                      )} />
                      {isGenerating
                        ? (jobStatus === "queued" ? `QUEUED #${jobPosition}` : t.generator.statusProcessing)
                        : generatedImage ? t.generator.statusComplete : t.generator.statusIdle}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* History thumbnails - Horizontal at bottom */}
            <AnimatePresence>
              {history.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex gap-2 p-3 border border-[var(--border-color)] bg-[var(--background)]/50 overflow-x-auto custom-scrollbar">
                    {history.map((item, i) => (
                      <div
                        key={i}
                        className="w-16 h-16 flex-shrink-0 rounded overflow-hidden border border-[var(--border-color)] hover:border-primary transition-colors cursor-pointer group relative"
                        onClick={() => setGeneratedImage(item.url)}
                        title={item.prompt}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.url} alt="Thumbnail" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: Control Panel (40%) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
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
                  className="w-full h-[228px] bg-transparent border-none outline-none text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] font-mono text-sm leading-relaxed resize-none"
                  onKeyDown={(e) => e.key === "Enter" && e.metaKey && handleGenerate()}
                />

                {/* Optimization Button */}
                <div className="absolute top-4 right-4">
                  <motion.button
                    onClick={handleOptimize}
                    disabled={isOptimizing || !config.prompt}
                    className={cn(
                      "p-2 rounded-full transition-all duration-300 border border-transparent",
                      isOptimizing || !config.prompt
                        ? "text-[var(--foreground-muted)] cursor-not-allowed"
                        : "text-primary hover:bg-primary/10 hover:border-primary/30"
                    )}
                    whileHover={!isOptimizing && config.prompt ? { scale: 1.1 } : {}}
                    whileTap={!isOptimizing && config.prompt ? { scale: 0.9 } : {}}
                    title="Optimize Prompt with AI"
                  >
                    <AnimatePresence mode="wait">
                      {isOptimizing ? (
                        <motion.div
                          key="optimizing"
                          initial={{ opacity: 0, rotate: -180 }}
                          animate={{ opacity: 1, rotate: 0 }}
                          exit={{ opacity: 0, rotate: 180 }}
                          transition={{ duration: 0.3 }}
                        >
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="idle"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Sparkles className="w-4 h-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
                  <span className="font-mono text-xs text-[var(--foreground-muted)]">
                    {config.prompt.length} {t.generator.promptHint}
                  </span>
                  <motion.button
                    onClick={handleGenerate}
                    disabled={isSubmitting || !config.prompt}
                    className={cn(
                      "relative overflow-hidden font-display text-sm tracking-widest px-6 py-3 transition-all duration-300 flex items-center gap-3",
                      isSubmitting || !config.prompt
                        ? "bg-[var(--foreground-muted)]/10 text-[var(--foreground-muted)] cursor-not-allowed"
                        : showSuccess
                          ? "bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                          : "bg-primary text-black hover:shadow-[0_0_30px_rgba(0,255,157,0.5)]"
                    )}
                    whileHover={!isSubmitting && config.prompt && !showSuccess ? { scale: 1.02 } : {}}
                    whileTap={!isSubmitting && config.prompt ? { scale: 0.95 } : {}}
                    animate={showSuccess ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Scanning light effect */}
                    {!isSubmitting && !showSuccess && config.prompt && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 3,
                          ease: "easeInOut"
                        }}
                      />
                    )}

                    {/* Ripple effect on click */}
                    {!isSubmitting && !showSuccess && (
                      <motion.div
                        className="absolute inset-0 bg-white/30"
                        initial={{ scale: 0, opacity: 0.5 }}
                        whileTap={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 0.6 }}
                      />
                    )}

                    <AnimatePresence mode="wait">
                      {isSubmitting ? (
                        <motion.div
                          key="submitting"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-3"
                        >
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          <span>{t.generator.processing}</span>
                        </motion.div>
                      ) : showSuccess ? (
                        <motion.div
                          key="success"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="flex items-center gap-3"
                        >
                          <motion.div
                            initial={{ rotate: -90 }}
                            animate={{ rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200 }}
                          >
                            <Check className="w-5 h-5" />
                          </motion.div>
                          <span>QUEUED</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="idle"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-3"
                        >
                          <span>{t.generator.generate}</span>
                          <Send className="w-4 h-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="border border-[var(--border-color)] bg-[var(--background)]/50">
              <button
                onClick={() => {
                  if (showSettings) setOverflowVisible(false);
                  setShowSettings(!showSettings);
                }}
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
                    className={cn("overflow-hidden", overflowVisible && "overflow-visible")}
                    onAnimationComplete={() => {
                      if (showSettings) setOverflowVisible(true);
                    }}
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
                        {/* Aspect Ratio */}
                        <div className="col-span-2">
                          <div className="flex items-center mb-2">
                            <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)]">{t.generator.aspectRatioLabel}</label>
                            <Tooltip content={t.generator.tooltipAspectRatio} />
                          </div>
                          <div className="flex gap-3">
                            {/* Landscape */}
                            <button
                              type="button"
                              onClick={() => {
                                updateConfig("width", 1024);
                                updateConfig("height", 768);
                              }}
                              className={cn(
                                "flex-1 px-4 py-3 border transition-all font-mono text-xs tracking-wider flex items-center justify-center gap-2",
                                config.width > config.height
                                  ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                                  : "bg-transparent text-[var(--foreground-dim)] border-[var(--border-color)] hover:border-[var(--border-hover)]"
                              )}
                            >
                              <RectangleHorizontal className="w-4 h-4" />
                              <span>{t.generator.landscape}</span>
                            </button>

                            {/* Square */}
                            <button
                              type="button"
                              onClick={() => {
                                updateConfig("width", 1024);
                                updateConfig("height", 1024);
                              }}
                              className={cn(
                                "flex-1 px-4 py-3 border transition-all font-mono text-xs tracking-wider flex items-center justify-center gap-2",
                                config.width === config.height
                                  ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                                  : "bg-transparent text-[var(--foreground-dim)] border-[var(--border-color)] hover:border-[var(--border-hover)]"
                              )}
                            >
                              <SquareIcon className="w-4 h-4" />
                              <span>{t.generator.square}</span>
                            </button>

                            {/* Portrait */}
                            <button
                              type="button"
                              onClick={() => {
                                updateConfig("width", 768);
                                updateConfig("height", 1024);
                              }}
                              className={cn(
                                "flex-1 px-4 py-3 border transition-all font-mono text-xs tracking-wider flex items-center justify-center gap-2",
                                config.width < config.height
                                  ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                                  : "bg-transparent text-[var(--foreground-dim)] border-[var(--border-color)] hover:border-[var(--border-hover)]"
                              )}
                            >
                              <RectangleVertical className="w-4 h-4" />
                              <span>{t.generator.portrait}</span>
                            </button>
                          </div>
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
        </div>
      </div>

      {/* Noise overlay */}
      <div className="noise-overlay" />
    </section>
  );
}
