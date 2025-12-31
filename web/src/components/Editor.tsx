"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  Image as ImageIcon,
  Maximize2,
  RefreshCw,
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

  // macOS/MPS 预设：优先速度（Quick/Standard/HQ）
  type Preset = "quick" | "standard" | "hq" | "custom";
  const [preset, setPreset] = useState<Preset>("standard");

  const [maxSide, setMaxSide] = useState<number>(768);
  const [steps, setSteps] = useState<number>(25);
  const [guidance, setGuidance] = useState<number>(1.0);
  const [seed, setSeed] = useState<number>(-1);
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

    console.log("[Editor] URL params:", { src, p, np });

    if (p) setPrompt(p);
    if (np) setNegativePrompt(np);

    if (!src) {
      console.log("[Editor] No src param, skipping image load");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        // Use proxy API to avoid CORS issues (backend doesn't have CORS enabled)
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`;
        console.log("[Editor] Fetching image via proxy:", proxyUrl);

        const res = await fetch(proxyUrl);
        console.log("[Editor] Proxy response:", { ok: res.ok, status: res.status, type: res.type });
        if (!res.ok) {
          console.error("[Editor] Proxy fetch failed with status:", res.status);
          return;
        }

        const blob = await res.blob();
        if (cancelled) {
          console.log("[Editor] Cancelled, not creating file");
          return;
        }
        console.log("[Editor] Got blob:", { type: blob.type, size: blob.size });

        const ext = blob.type.includes("jpeg") ? "jpg" : blob.type.includes("webp") ? "webp" : "png";
        const f = new File([blob], `input.${ext}`, { type: blob.type || "image/png" });
        console.log("[Editor] Created File object:", { name: f.name, size: f.size, type: f.type });
        setFile(f);
        console.log("[Editor] setFile called successfully");
      } catch (error) {
        console.error("[Editor] Failed to load image:", error);
      }
    })();

    return () => {
      cancelled = true;
      console.log("[Editor] Cleanup: cancelled set to true");
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
      form.append("max_side", String(maxSide));
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

      let pollFailures = 0;
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

          pollFailures = 0;
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
        } catch (e) {
          pollFailures += 1;
          console.error("Polling error:", e);
          if (pollFailures >= 5) {
            clearInterval(pollInterval);
            alert(t.editor.errorGeneric);
          }
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


        {/* New Layout: Image-First Design */}
        <div className="space-y-6">

          {/* TOP: Image Comparison Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
              {/* Input preview - with integrated upload */}
              <div
                className={cn(
                  "relative h-[450px] w-full border-2 bg-[var(--background)]/80 overflow-hidden transition-all cursor-pointer group",
                  inputPreview ? "border-[var(--primary-dim)]" : "border-[var(--border-color)] border-dashed hover:border-primary"
                )}
                onClick={() => document.getElementById('editor-file-input')?.click()}
              >
                <input
                  id="editor-file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setFile(f);
                  }}
                  className="hidden"
                />
                {/* Corner decorations */}
                <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-[var(--primary-muted)] z-10" />
                <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-[var(--primary-muted)] z-10" />
                <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-[var(--primary-muted)] z-10" />
                <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-[var(--primary-muted)] z-10" />

                <div className="absolute inset-0 pointer-events-none opacity-20 scanlines" />
                {inputPreview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={inputPreview} alt="Input" className="w-full h-full object-contain bg-black/50" />
                    {/* Hover overlay to change image */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
                        <p className="font-mono text-xs text-primary">{t.editor.clickToChange}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                    <motion.div
                      className="w-20 h-20 mx-auto mb-6 border-2 border-dashed border-[var(--border-color)] flex items-center justify-center group-hover:border-primary transition-colors"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Upload className="w-8 h-8 text-[var(--primary-muted)] group-hover:text-primary transition-colors" />
                    </motion.div>
                    <p className="font-mono text-sm tracking-widest text-[var(--foreground-dim)]">{t.editor.inputImage}</p>
                    <p className="font-mono text-xs text-[var(--foreground-muted)] mt-2">{t.editor.inputHint}</p>
                  </div>
                )}
                {/* Label */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[var(--background)]/90 px-4 py-1 border border-[var(--border-color)]">
                  <span className="font-mono text-xs tracking-widest text-[var(--foreground-muted)]">INPUT</span>
                </div>
              </div>

              {/* Arrow indicator */}
              <div className="hidden md:flex flex-col items-center justify-center px-4">
                <motion.div
                  animate={{ x: [0, 10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="flex items-center gap-2"
                >
                  <div className="w-16 h-[2px] bg-gradient-to-r from-transparent to-primary" />
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all",
                    jobStatus ? "border-primary bg-primary/20 animate-pulse" : "border-[var(--border-color)] bg-[var(--background)]"
                  )}>
                    <Wand2 className={cn("w-5 h-5", jobStatus ? "text-primary" : "text-[var(--foreground-muted)]")} />
                  </div>
                  <div className="w-16 h-[2px] bg-gradient-to-r from-primary to-transparent" />
                </motion.div>
                <p className="font-mono text-[10px] tracking-widest text-[var(--foreground-muted)] mt-2">AI EDIT</p>
              </div>

              {/* Output preview */}
              <div className={cn(
                "relative h-[450px] w-full border-2 bg-[var(--background)]/80 overflow-hidden transition-all duration-500",
                jobStatus ? "border-primary animate-pulse-neon" : outputImage ? "border-[var(--primary-dim)]" : "border-[var(--border-color)]"
              )}>
                {/* Corner decorations */}
                <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-[var(--primary-muted)] z-10" />
                <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-[var(--primary-muted)] z-10" />
                <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-[var(--primary-muted)] z-10" />
                <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-[var(--primary-muted)] z-10" />

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
                            <Wand2 className="w-8 h-8 text-primary animate-pulse" />
                          </div>
                        </div>
                        <p className="font-mono text-sm tracking-widest text-primary">
                          {jobStatus === "queued" ? `QUEUED (POS: ${jobPosition})` : t.editor.editing}
                        </p>
                        <p className="font-mono text-xs text-[var(--foreground-muted)] mt-2">{t.editor.editingHint}</p>
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
                        <p className="font-mono text-sm tracking-widest text-[var(--foreground-dim)]">{t.editor.outputPreview}</p>
                        <p className="font-mono text-xs text-[var(--foreground-muted)] mt-2">{t.editor.outputHint}</p>
                      </div>
                    )}
                  </div>
                )}
                {/* Label */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[var(--background)]/90 px-4 py-1 border border-[var(--border-color)]">
                  <span className="font-mono text-xs tracking-widest text-[var(--foreground-muted)]">OUTPUT</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* BOTTOM: Control Panel - Side by Side Layout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT: Prompt Input */}
              <div className={cn(
                "relative border-2 transition-all duration-300",
                jobStatus
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
                    <Wand2 className="w-5 h-5 text-primary" />
                    <span className="font-mono text-xs tracking-widest text-[var(--primary-dim)]">{t.editor.promptLabel}</span>
                  </div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t.editor.promptPlaceholder}
                    className="w-full h-[290px] bg-transparent border-none outline-none text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] font-mono text-sm leading-relaxed resize-none"
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
                      whileHover={!isSubmitting && file && prompt ? { scale: 1.02 } : {}}
                      whileTap={!isSubmitting && file && prompt ? { scale: 0.95 } : {}}
                    >
                      {/* Scanning light effect */}
                      {!isSubmitting && file && prompt && (
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
                      <AnimatePresence mode="wait">
                        {isSubmitting ? (
                          <motion.div
                            key="submitting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-3"
                          >
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            <span>{t.editor.processing}</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-3"
                          >
                            <span>{t.editor.edit}</span>
                            <Wand2 className="w-4 h-4" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* RIGHT: Advanced Parameters */}
              <div className="border border-[var(--border-color)] bg-[var(--background)]/80 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Settings2 className="w-5 h-5 text-primary" />
                  <span className="font-mono text-xs tracking-widest text-[var(--primary-dim)]">{t.editor.advancedParams}</span>
                </div>

                {/* Presets */}
                <div className="mb-6">
                  <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)]">{t.editor.presetLabel}</label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPreset("quick");
                        setMaxSide(512);
                        setSteps(15);
                        setGuidance(1.0);
                      }}
                      className={cn(
                        "px-3 py-2 border text-xs font-mono tracking-wider transition-all",
                        preset === "quick"
                          ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                          : "bg-transparent text-[var(--foreground-dim)] border-[var(--border-color)] hover:border-[var(--border-hover)]"
                      )}
                    >
                      {t.editor.presetQuick}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreset("standard");
                        setMaxSide(768);
                        setSteps(25);
                        setGuidance(1.0);
                      }}
                      className={cn(
                        "px-3 py-2 border text-xs font-mono tracking-wider transition-all",
                        preset === "standard"
                          ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                          : "bg-transparent text-[var(--foreground-dim)] border-[var(--border-color)] hover:border-[var(--border-hover)]"
                      )}
                    >
                      {t.editor.presetStandard}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreset("hq");
                        setMaxSide(1024);
                        setSteps(40);
                        setGuidance(1.0);
                      }}
                      className={cn(
                        "px-3 py-2 border text-xs font-mono tracking-wider transition-all",
                        preset === "hq"
                          ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                          : "bg-transparent text-[var(--foreground-dim)] border-[var(--border-color)] hover:border-[var(--border-hover)]"
                      )}
                    >
                      {t.editor.presetHQ}
                    </button>
                  </div>
                  <p className="font-mono text-xs text-[var(--foreground-muted)] mt-2">{t.editor.presetHint}</p>
                </div>

                <div className="space-y-4">
                  <div>
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
                    <div className="col-span-2">
                      <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)]">{t.editor.maxSideLabel}</label>
                      <div className="mt-2 flex gap-2">
                        <input
                          type="range"
                          min={512}
                          max={1024}
                          step={64}
                          value={maxSide}
                          onChange={(e) => {
                            setPreset("custom");
                            setMaxSide(parseInt(e.target.value) || 768);
                          }}
                          className="flex-1"
                        />
                        <input
                          type="number"
                          min={256}
                          max={2048}
                          step={64}
                          value={maxSide}
                          onChange={(e) => {
                            setPreset("custom");
                            setMaxSide(parseInt(e.target.value) || 768);
                          }}
                          className="input-brutal w-28 text-sm"
                        />
                      </div>
                      <p className="font-mono text-xs text-[var(--foreground-muted)] mt-2">{t.editor.maxSideHint}</p>
                    </div>

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
                        onChange={(e) => {
                          setPreset("custom");
                          setSteps(parseInt(e.target.value) || 25);
                        }}
                        className="input-brutal w-full text-sm mt-2"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)]">{t.editor.cfgLabel}</label>
                      <input
                        type="number"
                        step={0.1}
                        value={guidance}
                        onChange={(e) => {
                          setPreset("custom");
                          setGuidance(parseFloat(e.target.value) || 1.0);
                        }}
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
                          onClick={() => setSeed(Math.floor(Math.random() * 1000000))}
                          className="px-4 border border-[var(--border-color)] hover:border-primary hover:bg-[var(--primary-subtle)] transition-all"
                          title="Randomize seed"
                        >
                          <RefreshCw className="w-4 h-4 text-[var(--primary-dim)]" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="font-mono text-xs text-[var(--foreground-muted)] pt-2">{t.editor.strengthHint}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="noise-overlay" />
    </section>
  );
}
