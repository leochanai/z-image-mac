"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, Image as ImageIcon, Send, Settings2, ChevronDown, ChevronUp, Info, Download, RefreshCw, Maximize2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black border border-primary/30 text-xs text-white/80 whitespace-nowrap font-mono z-50"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary/30" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function Generator() {
  const [config, setConfig] = useState<GenerationConfig>({
    prompt: "",
    negative_prompt: "",
    width: 1024,
    height: 1024,
    steps: 9,
    guidance: 0.0,
    seed: 42,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleGenerate = async () => {
    if (!config.prompt) return;
    setIsGenerating(true);
    setGeneratedImage(null);
    
    try {
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
          seed: config.seed,
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
    <section id="generator" className="min-h-screen py-20 px-6 md:px-12 relative">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      
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
            <span className="font-mono text-xs tracking-widest text-primary">02 // GENERATE</span>
          </div>
          <h2 className="font-display text-4xl md:text-6xl tracking-tight text-white">
            IMAGE <span className="neon-text">SYNTHESIS</span>
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
                : "border-primary/30 hover:border-primary/60"
            )}>
              {/* Corner decorations */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-primary" />
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-primary" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-primary" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-primary" />
              
              <div className="p-6 bg-black/80">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="font-mono text-xs tracking-widest text-primary/60">PROMPT INPUT</span>
                </div>
                <textarea
                  value={config.prompt}
                  onChange={(e) => updateConfig("prompt", e.target.value)}
                  placeholder="Describe your vision... (支持中英文)"
                  className="w-full h-32 bg-transparent border-none outline-none text-white placeholder:text-white/20 font-mono text-sm leading-relaxed resize-none"
                  onKeyDown={(e) => e.key === "Enter" && e.metaKey && handleGenerate()}
                />
                <div className="flex items-center justify-between pt-4 border-t border-primary/10">
                  <span className="font-mono text-xs text-white/30">
                    {config.prompt.length} chars • ⌘+Enter to generate
                  </span>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !config.prompt}
                    className={cn(
                      "font-display text-sm tracking-widest px-6 py-3 transition-all duration-300 flex items-center gap-3",
                      isGenerating || !config.prompt
                        ? "bg-white/5 text-white/30 cursor-not-allowed"
                        : "bg-primary text-black hover:shadow-[0_0_30px_rgba(0,255,157,0.4)]"
                    )}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        PROCESSING
                      </>
                    ) : (
                      <>
                        GENERATE
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="border border-primary/20 bg-black/50">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings2 className="w-4 h-4 text-primary/60" />
                  <span className="font-mono text-xs tracking-widest text-white/60">ADVANCED PARAMETERS</span>
                </div>
                {showSettings ? (
                  <ChevronUp className="w-4 h-4 text-primary/60" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-primary/60" />
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
                    <div className="px-6 pb-6 space-y-4 border-t border-primary/10">
                      {/* Negative Prompt */}
                      <div className="pt-4">
                        <div className="flex items-center mb-2">
                          <label className="font-mono text-xs tracking-widest text-white/40">NEGATIVE</label>
                          <Tooltip content="排除不希望出现的元素" />
                        </div>
                        <input
                          type="text"
                          value={config.negative_prompt}
                          onChange={(e) => updateConfig("negative_prompt", e.target.value)}
                          placeholder="blurry, low quality, watermark..."
                          className="input-brutal w-full text-sm"
                        />
                      </div>

                      {/* Grid of parameters */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Width */}
                        <div>
                          <div className="flex items-center mb-2">
                            <label className="font-mono text-xs tracking-widest text-white/40">WIDTH</label>
                            <Tooltip content="图片宽度 (16的倍数)" />
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
                            <label className="font-mono text-xs tracking-widest text-white/40">HEIGHT</label>
                            <Tooltip content="图片高度 (16的倍数)" />
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
                            <label className="font-mono text-xs tracking-widest text-white/40">STEPS</label>
                            <Tooltip content="采样步数 (1-50)" />
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
                            <label className="font-mono text-xs tracking-widest text-white/40">CFG</label>
                            <Tooltip content="引导强度 (Turbo建议0)" />
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
                          <label className="font-mono text-xs tracking-widest text-white/40">SEED</label>
                          <Tooltip content="随机种子 (固定种子可复现结果)" />
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={config.seed}
                            onChange={(e) => updateConfig("seed", parseInt(e.target.value) || 42)}
                            className="input-brutal flex-1 text-sm"
                          />
                          <button
                            onClick={randomizeSeed}
                            className="px-4 border border-primary/30 hover:border-primary hover:bg-primary/10 transition-all"
                            title="Randomize seed"
                          >
                            <RefreshCw className="w-4 h-4 text-primary/60" />
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
              "relative aspect-square border-2 bg-black/80 overflow-hidden transition-all duration-500",
              isGenerating 
                ? "border-primary animate-pulse-neon" 
                : generatedImage 
                  ? "border-primary/60" 
                  : "border-primary/20"
            )}>
              {/* Corner decorations */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-primary/40 z-10" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-primary/40 z-10" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-primary/40 z-10" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-primary/40 z-10" />
              
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
                      className="p-4 border-2 border-primary/50 hover:border-primary hover:bg-primary/10 transition-all"
                      title="Download"
                    >
                      <Download className="w-6 h-6 text-primary" />
                    </a>
                    <a
                      href={generatedImage}
                      target="_blank"
                      className="p-4 border-2 border-primary/50 hover:border-primary hover:bg-primary/10 transition-all"
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
                        <div className="absolute inset-0 border-2 border-primary/30 animate-ping" />
                        <div className="absolute inset-2 border-2 border-primary/50 animate-pulse" />
                        <div className="absolute inset-4 border-2 border-primary flex items-center justify-center">
                          <Zap className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <p className="font-mono text-xs tracking-widest text-primary/80">GENERATING...</p>
                      <p className="font-mono text-xs text-white/30 mt-2">This may take a few seconds</p>
                    </motion.div>
                  ) : (
                    <div className="text-center p-8">
                      <div className="w-20 h-20 mx-auto mb-6 border-2 border-dashed border-primary/20 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-primary/20" />
                      </div>
                      <p className="font-mono text-xs tracking-widest text-white/30">OUTPUT PREVIEW</p>
                      <p className="font-mono text-xs text-white/20 mt-2">Enter a prompt and generate</p>
                    </div>
                  )}
                </div>
              )}

              {/* Status bar at bottom */}
              <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-black/80 border-t border-primary/20">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-white/30">
                    {config.width}×{config.height} • {config.steps} steps
                  </span>
                  <span className={cn(
                    "flex items-center gap-2",
                    isGenerating ? "text-primary" : generatedImage ? "text-primary/60" : "text-white/20"
                  )}>
                    <span className={cn(
                      "w-2 h-2",
                      isGenerating ? "bg-primary animate-pulse" : generatedImage ? "bg-primary" : "bg-white/20"
                    )} />
                    {isGenerating ? "PROCESSING" : generatedImage ? "COMPLETE" : "IDLE"}
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
