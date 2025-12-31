"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  Image as ImageIcon,
  Maximize2,
  RefreshCw,
  Send,
  Settings2,
  Upload,
  Wand2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

export function Editor() {
  const { t } = useLocale();
  const searchParams = useSearchParams();

  const [file, setFile] = useState<File | null>(null);
  const [inputPreview, setInputPreview] = useState<string | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);

  const [prompt, setPrompt] = useState<string>("");
  const [negativePrompt, setNegativePrompt] = useState<string>("");
  const [strength, setStrength] = useState<number>(0.6);
  const [steps, setSteps] = useState<number>(40);
  const [guidance, setGuidance] = useState<number>(1.0);
  const [seed, setSeed] = useState<number>(-1);

  const [showSettings, setShowSettings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobPosition, setJobPosition] = useState<number | null>(null);

  // Track latest job id to avoid UI race
  const latestJobId = useRef<string | null>(null);

  const backendBase = useMemo(() => "http://127.0.0.1:8000", []);

  // Load params (src/prompt/negative_prompt) when arriving from Gallery
  useEffect(() => {
    const src = searchParams.get("src");
    const p = searchParams.get("prompt");
    const np = searchParams.get("negative_prompt");

    if (p) setPrompt(p);
    if (np) setNegativePrompt(np);

    if (!src) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) return;
        const blob = await res.blob();
        if (cancelled) return;
        const ext = blob.type.includes("jpeg") ? "jpg" : blob.type.includes("webp") ? "webp" : "png";
        const f = new File([blob], `input.${ext}`, { type: blob.type || "image/png" });
        setFile(f);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  // Preview URL lifecycle
  useEffect(() => {
    if (!file) {
      setInputPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setInputPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const randomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 2147483647));
  };

  const handleEdit = async () => {
    if (!file || !prompt) return;

    setIsSubmitting(true);
    setOutputImage(null);
    setJobStatus("queued");

    try {
      const seedToSend = seed === -1 ? Math.floor(Math.random() * 2147483647) : seed;

      const form = new FormData();
      form.append("image", file);
      form.append("prompt", prompt);
      if (negativePrompt) form.append("negative_prompt", negativePrompt);
      form.append("strength", String(strength));
      form.append("steps", String(steps));
      form.append("guidance", String(guidance));
      form.append("seed", String(seedToSend));

      const response = await fetch(`${backendBase}/api/edit`, {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const jobId = data.job_id as string;
      latestJobId.current = jobId;
      setIsSubmitting(false);

      const pollInterval = setInterval(async () => {
        if (latestJobId.current !== jobId) {
          clearInterval(pollInterval);
          return;
        }

        try {
          const statusRes = await fetch(`${backendBase}/api/job/${jobId}`);
          if (!statusRes.ok) throw new Error("Failed to fetch job status");

          const statusData = await statusRes.json();
          if (latestJobId.current !== jobId) {
            clearInterval(pollInterval);
            return;
          }

          setJobStatus(statusData.status);
          setJobPosition(statusData.position);

          if (statusData.status === "completed") {
            clearInterval(pollInterval);
            if (statusData.result && statusData.result.url) {
              setOutputImage(`${backendBase}${statusData.result.url}`);
            }
            setJobStatus(null);
          } else if (statusData.status === "failed") {
            clearInterval(pollInterval);
            setJobStatus(null);
            alert(`Edit failed: ${statusData.error}`);
          }
        } catch {
          clearInterval(pollInterval);
          setJobStatus(null);
        }
      }, 1000);
    } catch (error) {
      console.error("Edit failed:", error);
      alert(t.editor.errorGeneric);
      setIsSubmitting(false);
      setJobStatus(null);
    }
  };

  return (
    <section className="min-h-screen py-20 px-6 md:px-12 relative bg-[var(--background)]">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-transparent to-[var(--background)]" />

      <div className="container max-w-[1600px] mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="h-[2px] w-12 bg-primary" />
            <span className="font-mono text-xs tracking-widest text-primary">{t.editor.sectionLabel}</span>
          </div>
          <h2 className="font-display text-4xl md:text-6xl tracking-tight text-[var(--foreground)]">
            {t.editor.title} <span className="neon-text">{t.editor.titleHighlight}</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[4fr_6fr] gap-6">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Upload */}
            <div className="border-2 border-[var(--border-color)] bg-[var(--background)]/80 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Upload className="w-5 h-5 text-primary" />
                <span className="font-mono text-xs tracking-widest text-[var(--primary-dim)]">{t.editor.inputImage}</span>
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                }}
                className="block w-full text-sm font-mono text-[var(--foreground-dim)]"
              />
              <p className="mt-2 font-mono text-xs text-[var(--foreground-muted)]">{t.editor.inputHint}</p>
            </div>

            {/* Prompt */}
            <div className={cn("relative border-2 transition-all duration-300", jobStatus ? "border-primary animate-pulse-neon" : "border-[var(--border-color)] hover:border-[var(--border-hover)]")}>
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-primary" />
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-primary" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-primary" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-primary" />

              <div className="p-6 bg-[var(--background)]/80">
                <div className="flex items-center gap-3 mb-4">
                  <Wand2 className="w-5 h-5 text-primary" />
                  <span className="font-mono text-xs tracking-widest text-[var(--primary-dim)]">{t.editor.promptLabel}</span>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t.editor.promptPlaceholder}
                  className="w-full h-[180px] bg-transparent border-none outline-none text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] font-mono text-sm leading-relaxed resize-none"
                />

                <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
                  <span className="font-mono text-xs text-[var(--foreground-muted)]">
                    {prompt.length} {t.editor.promptHint}
                  </span>
                  <motion.button
                    onClick={handleEdit}
                    disabled={isSubmitting || !file || !prompt}
                    className={cn(
                      "relative overflow-hidden font-display text-sm tracking-widest px-6 py-3 transition-all duration-300 flex items-center gap-3",
                      isSubmitting || !file || !prompt
                        ? "bg-[var(--foreground-muted)]/10 text-[var(--foreground-muted)] cursor-not-allowed"
                        : "bg-primary text-black hover:shadow-[var(--glow-primary)]"
                    )}
                    whileTap={!isSubmitting && file && prompt ? { scale: 0.95 } : {}}
                  >
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
                          <span>{t.editor.processing}</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="idle"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-3"
                        >
                          <span>{t.editor.edit}</span>
                          <Send className="w-4 h-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="border border-[var(--border-color)] bg-[var(--background)]/50">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-[var(--primary-subtle)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings2 className="w-4 h-4 text-[var(--primary-dim)]" />
                  <span className="font-mono text-xs tracking-widest text-[var(--foreground-dim)]">{t.editor.advancedParams}</span>
                </div>
                {showSettings ? (
                  <RefreshCw className="w-4 h-4 text-[var(--primary-dim)]" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-[var(--primary-muted)]" />
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
                      <div className="pt-4">
                        <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)]">{t.editor.negativeLabel}</label>
                        <input
                          type="text"
                          value={negativePrompt}
                          onChange={(e) => setNegativePrompt(e.target.value)}
                          placeholder={t.editor.negativePlaceholder}
                          className="input-brutal w-full text-sm mt-2"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)]">{t.editor.strengthLabel}</label>
                          <input
                            type="number"
                            min={0.05}
                            max={1}
                            step={0.05}
                            value={strength}
                            onChange={(e) => setStrength(parseFloat(e.target.value) || 0.6)}
                            className="input-brutal w-full text-sm mt-2"
                          />
                        </div>
                        <div>
                          <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)]">{t.editor.stepsLabel}</label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={steps}
                            onChange={(e) => setSteps(parseInt(e.target.value) || 9)}
                            className="input-brutal w-full text-sm mt-2"
                          />
                        </div>
                        <div>
                          <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)]">{t.editor.cfgLabel}</label>
                          <input
                            type="number"
                            step={0.1}
                            value={guidance}
                            onChange={(e) => setGuidance(parseFloat(e.target.value) || 0)}
                            className="input-brutal w-full text-sm mt-2"
                          />
                        </div>
                        <div>
                          <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)]">{t.editor.seedLabel}</label>
                          <div className="flex gap-2 mt-2">
                            <input
                              type="number"
                              value={seed}
                              onChange={(e) => {
                                const v = parseInt(e.target.value);
                                setSeed(Number.isNaN(v) ? -1 : v);
                              }}
                              className="input-brutal flex-1 text-sm"
                            />
                            <button
                              onClick={randomizeSeed}
                              className="px-4 border border-[var(--border-color)] hover:border-primary hover:bg-[var(--primary-subtle)] transition-all"
                              title={t.editor.randomizeSeed}
                            >
                              <RefreshCw className="w-4 h-4 text-[var(--primary-dim)]" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <p className="font-mono text-xs text-[var(--foreground-muted)]">{t.editor.strengthHint}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right: preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Input preview */}
              <div className="relative h-[420px] w-full border-2 border-[var(--border-color)] bg-[var(--background)]/80 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-20 scanlines" />
                {inputPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={inputPreview} alt="Input" className="w-full h-full object-contain bg-black/50" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                    <div className="w-20 h-20 mx-auto mb-6 border-2 border-dashed border-[var(--border-color)] flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-[var(--primary-muted)]" />
                    </div>
                    <p className="font-mono text-xs tracking-widest text-[var(--foreground-muted)]">{t.editor.inputPreview}</p>
                  </div>
                )}
              </div>

              {/* Output preview */}
              <div className={cn("relative h-[420px] w-full border-2 bg-[var(--background)]/80 overflow-hidden transition-all duration-500", jobStatus ? "border-primary animate-pulse-neon" : "border-[var(--border-color)]")}>
                <div className="absolute inset-0 pointer-events-none opacity-20 scanlines" />
                {outputImage ? (
                  <div className="relative w-full h-full group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={outputImage} alt="Output" className="w-full h-full object-contain bg-black/50" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <a
                        href={outputImage}
                        download
                        className="p-4 border-2 border-[var(--primary-dim)] hover:border-primary hover:bg-[var(--primary-subtle)] transition-all"
                        title={t.editor.download}
                      >
                        <Download className="w-6 h-6 text-primary" />
                      </a>
                      <a
                        href={outputImage}
                        target="_blank"
                        className="p-4 border-2 border-[var(--primary-dim)] hover:border-primary hover:bg-[var(--primary-subtle)] transition-all"
                        title={t.editor.open}
                      >
                        <Maximize2 className="w-6 h-6 text-primary" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {jobStatus ? (
                      <div className="text-center">
                        <div className="relative w-20 h-20 mx-auto mb-6">
                          <div className="absolute inset-0 border-2 border-[var(--primary-muted)] animate-ping" />
                          <div className="absolute inset-2 border-2 border-[var(--primary-dim)] animate-pulse" />
                          <div className="absolute inset-4 border-2 border-primary flex items-center justify-center">
                            <Wand2 className="w-6 h-6 text-primary" />
                          </div>
                        </div>
                        <p className="font-mono text-xs tracking-widest text-primary/80">
                          {jobStatus === "queued" ? `QUEUED (POS: ${jobPosition})` : t.editor.editing}
                        </p>
                        <p className="font-mono text-xs text-[var(--foreground-muted)] mt-2">{t.editor.editingHint}</p>
                      </div>
                    ) : (
                      <div className="text-center p-8">
                        <div className="w-20 h-20 mx-auto mb-6 border-2 border-dashed border-[var(--border-color)] flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-[var(--primary-muted)]" />
                        </div>
                        <p className="font-mono text-xs tracking-widest text-[var(--foreground-muted)]">{t.editor.outputPreview}</p>
                        <p className="font-mono text-xs text-[var(--foreground-muted)] mt-2">{t.editor.outputHint}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="noise-overlay" />
    </section>
  );
}
