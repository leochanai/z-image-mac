"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Image as ImageIcon, Send, Settings2, ChevronDown, ChevronUp, CircleHelp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * 图片生成配置接口
 * Interface for image generation configuration
 */
interface GenerationConfig {
  /**
   * 生成图片的文本提示词，支持中英文
   * Text prompt for image generation, supports Chinese and English
   */
  prompt: string;

  /**
   * 负面提示词，用于排除不希望出现的元素
   * Negative prompt to exclude unwanted elements
   */
  negative_prompt: string;

  /**
   * 图片宽度，默认 1024
   * Image width, default 1024
   */
  width: number;

  /**
   * 图片高度，默认 1024
   * Image height, default 1024
   */
  height: number;

  /**
   * 采样步数，默认 9
   * Sampling steps, default 9
   */
  steps: number;

  /**
   * CFG 引导强度，默认 0.0，Turbo 模型建议保持为 0
   * CFG guidance scale, default 0.0, recommended 0 for Turbo models
   */
  guidance: number;

  /**
   * 随机种子，默认 42
   * Random seed, default 42
   */
  seed: number;
}

const Tooltip = ({ content }: { content: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top - 8, // Just above the trigger
        left: rect.left + rect.width / 2
      });
      setIsVisible(true);
    }
  };

  return (
    <>
      <div 
        ref={triggerRef}
        className="relative inline-flex items-center ml-1.5"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
      >
        <CircleHelp className="w-3.5 h-3.5 text-white/30 hover:text-white/80 transition-colors cursor-help" />
      </div>
      {mounted && isVisible && createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{ 
                top: coords.top, 
                left: coords.left,
                position: 'fixed',
                zIndex: 9999,
                pointerEvents: 'none'
              }}
              className="-translate-x-1/2 -translate-y-full px-3 py-2 bg-zinc-900/95 border border-white/10 rounded-lg text-xs text-white/90 whitespace-nowrap backdrop-blur-md shadow-xl"
            >
              {content}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-900/95" />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
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

  return (
    <section id="generator" className="min-h-screen flex flex-col items-center justify-center py-20 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
      
      <div className="container max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Create Your <span className="text-primary">Masterpiece</span>
          </h2>
          <p className="text-white/60 text-lg">
            Describe what you want to see, and watch the magic happen.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass p-6 rounded-2xl shadow-2xl shadow-primary/10 border border-white/10 flex flex-col gap-4"
        >
          {/* Main Prompt Input */}
          <div className="flex items-center gap-2">
            <div className="p-4 bg-white/5 rounded-xl">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <input
              type="text"
              value={config.prompt}
              onChange={(e) => updateConfig("prompt", e.target.value)}
              placeholder="A futuristic city with flying cars at sunset..."
              className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder:text-white/30 px-4"
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !config.prompt}
              className={cn(
                "px-8 py-4 rounded-xl font-bold text-white transition-all duration-300 flex items-center gap-2",
                isGenerating || !config.prompt
                  ? "bg-white/10 cursor-not-allowed"
                  : "bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25 hover:scale-105"
              )}
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Advanced Settings Toggle */}
          <div className="border-t border-white/5 pt-4">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mx-auto"
            >
              <Settings2 className="w-4 h-4" />
              Advanced Settings
              {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Negative Prompt */}
                    <div className="md:col-span-2 space-y-2">
                      <div className="flex items-center">
                        <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Negative Prompt</label>
                        <Tooltip content="负面提示词，用于排除不希望出现的元素" />
                      </div>
                      <input
                        type="text"
                        value={config.negative_prompt}
                        onChange={(e) => updateConfig("negative_prompt", e.target.value)}
                        placeholder="Blurry, low quality, ugly..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-primary/50 outline-none transition-colors"
                      />
                    </div>

                    {/* Dimensions */}
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Width</label>
                        <Tooltip content="图片宽度，必须是 16 的倍数，默认 1024" />
                      </div>
                      <input
                        type="number"
                        step={16}
                        min={256}
                        value={config.width}
                        onChange={(e) => updateConfig("width", parseInt(e.target.value) || 0)}
                        onBlur={() => {
                          let val = config.width;
                          if (val < 256) val = 256;
                          val = Math.round(val / 16) * 16;
                          updateConfig("width", val);
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-primary/50 outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Height</label>
                        <Tooltip content="图片高度，必须是 16 的倍数，默认 1024" />
                      </div>
                      <input
                        type="number"
                        step={16}
                        min={256}
                        value={config.height}
                        onChange={(e) => updateConfig("height", parseInt(e.target.value) || 0)}
                        onBlur={() => {
                          let val = config.height;
                          if (val < 256) val = 256;
                          val = Math.round(val / 16) * 16;
                          updateConfig("height", val);
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-primary/50 outline-none transition-colors"
                      />
                    </div>

                    {/* Steps & Guidance */}
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Steps (1-50)</label>
                        <Tooltip content="采样步数，默认 9" />
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={config.steps}
                        onChange={(e) => updateConfig("steps", parseInt(e.target.value) || 9)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-primary/50 outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Guidance Scale</label>
                        <Tooltip content="CFG 引导强度，默认 0.0，Turbo 模型建议保持为 0" />
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        value={config.guidance}
                        onChange={(e) => updateConfig("guidance", parseFloat(e.target.value) || 0)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-primary/50 outline-none transition-colors"
                      />
                    </div>

                    {/* Seed */}
                    <div className="md:col-span-2 space-y-2">
                      <div className="flex items-center">
                        <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">Seed</label>
                        <Tooltip content="随机种子，默认 42" />
                      </div>
                      <input
                        type="number"
                        value={config.seed}
                        onChange={(e) => updateConfig("seed", parseInt(e.target.value) || 42)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-primary/50 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Results */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass aspect-square rounded-2xl flex items-center justify-center border border-white/5 bg-white/5 overflow-hidden relative group">
            {generatedImage ? (
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={generatedImage}
                alt="Generated"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="text-center text-white/20">
                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Generated image will appear here</p>
              </div>
            )}
          </div>
          <div className="glass aspect-square rounded-2xl flex items-center justify-center border border-white/5 bg-white/5">
            <div className="text-center text-white/20">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>History (Coming Soon)</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
