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
  X,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { useEditor } from "@/contexts/EditorContext";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

export function Editor() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const {
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
  } = useEditor();

  // Destructure config for easier access
  const {
    file,
    inputPreview,
    outputImage,
    prompt,
    negativePrompt,
    strength,
    preset,
    maxSide,
    steps,
    guidance,
    seed,
    isAdvancedOpen,
  } = config;

  // Local UI state (not persisted)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobPosition, setJobPosition] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

    // Close modal
    setIsModalOpen(false);

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
    <section className="min-h-screen flex items-center justify-center py-20 px-6 md:px-12 relative bg-[var(--background)]">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-transparent to-[var(--background)]" />

      {/* Main Container - Centered */}
      <div className="container max-w-[1400px] relative z-10">
        {/* Three Column Layout: INPUT + BUTTON + OUTPUT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 items-center"
        >
          {/* LEFT: Input Image */}
          <div
            className={cn(
              "relative h-[500px] w-full border-2 bg-[var(--background)]/80 overflow-hidden transition-all cursor-pointer group",
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

          {/* CENTER: Edit Button with Arrows */}
          <div className="flex flex-row items-start justify-center gap-6 px-4">
            {/* Left Arrow - pointing to the edit button */}
            <motion.div
              animate={{
                x: [0, 10, 0],
                opacity: file ? [0.6, 1, 0.6] : 0.2
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0 }}
              className="hidden lg:block mt-5"
            >
              <ArrowRight className={cn(
                "w-8 h-8",
                file ? "text-primary" : "text-[var(--foreground-muted)]"
              )} />
            </motion.div>

            {/* Edit Button */}
            <div className="flex flex-col items-center justify-center">
              <motion.button
                onClick={() => setIsModalOpen(true)}
                disabled={!file}
                className={cn(
                  "relative w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all group",
                  !file
                    ? "border-[var(--border-color)] bg-[var(--background)] cursor-not-allowed opacity-50"
                    : "border-primary bg-primary/10 hover:bg-primary/20 hover:scale-110"
                )}
                whileHover={file ? { scale: 1.1 } : {}}
                whileTap={file ? { scale: 0.95 } : {}}
              >
                <Wand2 className={cn("w-8 h-8", file ? "text-primary" : "text-[var(--foreground-muted)]")} />

                {/* Pulse effect when enabled */}
                {file && (
                  <motion.div
                    className="absolute inset-0 border-2 border-primary rounded-full"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>
              <p className="font-mono text-xs tracking-widest text-[var(--foreground-muted)] mt-4">
                {t.editor.edit}
              </p>
            </div>

            {/* Right Arrow - pointing away from the edit button */}
            <motion.div
              animate={{
                x: [0, 6, 0],
                opacity: file ? [0.6, 1, 0.6] : 0.2
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="hidden lg:block mt-5"
            >
              <ArrowRight className={cn(
                "w-8 h-8",
                file ? "text-primary" : "text-[var(--foreground-muted)]"
              )} />
            </motion.div>
          </div>

          {/* RIGHT: Output Image */}
          <div className={cn(
            "relative h-[500px] w-full border-2 bg-[var(--background)]/80 overflow-hidden transition-all duration-500",
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
        </motion.div>
      </div>

      {/* Edit Parameters Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6"
            >
              <div className="bg-[var(--background)] border-2 border-primary max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
                {/* Corner decorations */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary" />

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
                  <div className="flex items-center gap-3">
                    <Wand2 className="w-6 h-6 text-primary" />
                    <h2 className="font-mono text-lg tracking-widest text-primary">编辑参数</h2>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-[var(--primary-subtle)] transition-colors"
                  >
                    <X className="w-5 h-5 text-[var(--foreground-muted)]" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Edit Instruction */}
                  <div>
                    <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)] mb-3 block">
                      编辑指令
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={t.editor.promptPlaceholder}
                      className="w-full h-40 bg-[var(--background)]/50 border border-[var(--border-color)] px-4 py-3 outline-none text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] font-mono text-sm leading-relaxed resize-none focus:border-primary transition-colors"
                    />
                    <p className="font-mono text-xs text-[var(--foreground-muted)] mt-2">
                      {prompt.length} {t.editor.promptHint}
                    </p>
                  </div>

                  {/* Advanced Parameters - Collapsible */}
                  <div className="border border-[var(--border-color)]">
                    <button
                      onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                      className="w-full flex items-center justify-between p-4 hover:bg-[var(--primary-subtle)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Settings2 className="w-5 h-5 text-primary" />
                        <span className="font-mono text-xs tracking-widest text-[var(--primary-dim)]">
                          {t.editor.advancedParams}
                        </span>
                      </div>
                      {isAdvancedOpen ? (
                        <ChevronUp className="w-5 h-5 text-[var(--foreground-muted)]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[var(--foreground-muted)]" />
                      )}
                    </button>

                    <AnimatePresence>
                      {isAdvancedOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-6 pt-0 space-y-6 border-t border-[var(--border-color)]">
                            {/* Presets */}
                            <div>
                              <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)] block mb-2">
                                {t.editor.presetLabel}
                              </label>
                              <div className="grid grid-cols-3 gap-2">
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

                            {/* Negative Prompt */}
                            <div>
                              <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)] block mb-2">
                                {t.editor.negativeLabel}
                              </label>
                              <input
                                type="text"
                                value={negativePrompt}
                                onChange={(e) => setNegativePrompt(e.target.value)}
                                placeholder={t.editor.negativePlaceholder}
                                className="input-brutal w-full text-sm"
                              />
                            </div>

                            {/* Parameters Grid */}
                            <div className="grid grid-cols-2 gap-4">
                              {/* Max Side */}
                              <div className="col-span-2">
                                <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)] block mb-2">
                                  {t.editor.maxSideLabel}
                                </label>
                                <div className="flex gap-2">
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

                              {/* Strength */}
                              <div>
                                <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)] block mb-2">
                                  {t.editor.strengthLabel}
                                </label>
                                <input
                                  type="number"
                                  min={0.05}
                                  max={1}
                                  step={0.05}
                                  value={strength}
                                  onChange={(e) => setStrength(parseFloat(e.target.value) || 0.6)}
                                  className="input-brutal w-full text-sm"
                                />
                              </div>

                              {/* Steps */}
                              <div>
                                <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)] block mb-2">
                                  {t.editor.stepsLabel}
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={50}
                                  value={steps}
                                  onChange={(e) => {
                                    setPreset("custom");
                                    setSteps(parseInt(e.target.value) || 25);
                                  }}
                                  className="input-brutal w-full text-sm"
                                />
                              </div>

                              {/* Guidance */}
                              <div>
                                <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)] block mb-2">
                                  {t.editor.cfgLabel}
                                </label>
                                <input
                                  type="number"
                                  step={0.1}
                                  value={guidance}
                                  onChange={(e) => {
                                    setPreset("custom");
                                    setGuidance(parseFloat(e.target.value) || 1.0);
                                  }}
                                  className="input-brutal w-full text-sm"
                                />
                              </div>

                              {/* Seed */}
                              <div>
                                <label className="font-mono text-xs tracking-widest text-[var(--foreground-muted)] block mb-2">
                                  {t.editor.seedLabel}
                                </label>
                                <div className="flex gap-2">
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

                            <p className="font-mono text-xs text-[var(--foreground-muted)]">{t.editor.strengthHint}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-4 p-6 border-t border-[var(--border-color)]">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="font-mono text-sm px-6 py-3 border border-[var(--border-color)] hover:border-[var(--border-hover)] transition-all"
                  >
                    取消
                  </button>
                  <motion.button
                    onClick={handleEdit}
                    disabled={isSubmitting || !file || !prompt}
                    className={cn(
                      "relative overflow-hidden font-mono text-sm tracking-widest px-8 py-3 transition-all duration-300 flex items-center gap-3",
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
                          <span>开始编辑</span>
                          <Wand2 className="w-4 h-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="noise-overlay" />
    </section>
  );
}
