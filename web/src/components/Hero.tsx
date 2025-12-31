"use client";

import { motion } from "framer-motion";
import { ArrowDown, Cpu, Sparkles } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";

// Deterministic pseudo-random (pure) so render stays idempotent.
const rand01 = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Floating light orbs for atmospheric effect
const FloatingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(15)].map((_, i) => {
      const left = 10 + rand01(i * 11.11) * 80;
      const top = 10 + rand01(i * 22.22) * 80;
      const yAmp = 20 + rand01(i * 33.33) * 20;
      const scaleAmp = 1.5 + rand01(i * 44.44);
      const duration = 3 + rand01(i * 55.55) * 4;
      const delay = rand01(i * 66.66) * 3;

      return (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary rounded-full"
          style={{
            left: `${left}%`,
            top: `${top}%`,
          }}
          animate={{
            y: [0, -yAmp, 0],
            opacity: [0.2, 0.7, 0.2],
            scale: [1, scaleAmp, 1],
          }}
          transition={{
            duration,
            repeat: Infinity,
            delay,
            ease: "easeInOut",
          }}
        />
      );
    })}

    {/* Blue accent orbs */}
    {[...Array(8)].map((_, i) => {
      const left = 20 + rand01(100 + i * 11.11) * 60;
      const top = 20 + rand01(200 + i * 22.22) * 60;
      const yAmp = 15 + rand01(300 + i * 33.33) * 15;
      const duration = 4 + rand01(400 + i * 44.44) * 3;
      const delay = rand01(500 + i * 55.55) * 2;

      return (
        <motion.div
          key={`blue-${i}`}
          className="absolute w-0.5 h-0.5 bg-secondary rounded-full"
          style={{
            left: `${left}%`,
            top: `${top}%`,
          }}
          animate={{
            y: [0, -yAmp, 0],
            opacity: [0.1, 0.5, 0.1],
          }}
          transition={{
            duration,
            repeat: Infinity,
            delay,
            ease: "easeInOut",
          }}
        />
      );
    })}
  </div>
);

export function Hero() {
  const { t } = useLocale();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  const stats = [
    { label: t.hero.statResolution, value: "1024×1024" },
    { label: t.hero.statInference, value: "~3s" },
    { label: t.hero.statModel, value: "TURBO" },
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[var(--background)]">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 mesh-gradient-bg" />

      {/* Grid background */}
      <div className="absolute inset-0 grid-bg" />

      {/* Floating light particles */}
      <FloatingOrbs />

      {/* Neon Rift Effects - Diagonal light beams */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main diagonal rift */}
        <div
          className="absolute -top-1/2 -right-1/4 w-[200%] h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent rotate-[-35deg] opacity-60"
          style={{ boxShadow: 'var(--glow-primary)' }}
        />
        <div
          className="absolute top-1/3 -left-1/4 w-[150%] h-[1px] bg-gradient-to-r from-transparent via-secondary to-transparent rotate-[-35deg] opacity-40"
          style={{ boxShadow: '0 0 40px 10px var(--secondary)' }}
        />

        {/* Floating orbs */}
        <motion.div
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full"
          style={{
            background: 'radial-gradient(circle, var(--primary-muted) 0%, transparent 70%)',
            filter: 'blur(40px)'
          }}
        />
        <motion.div
          animate={{
            y: [0, 20, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/3 left-1/4 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, var(--primary-subtle) 0%, transparent 70%)',
            filter: 'blur(60px)'
          }}
        />
      </div>

      {/* Main Content - Asymmetric layout */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container relative z-10 px-6 md:px-12 pt-24"
      >
        <div className="max-w-5xl">
          {/* Status Badge */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 border border-[var(--border-color)] bg-[var(--background)]/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 bg-primary" />
              </span>
              <span className="font-mono text-xs tracking-widest text-primary/80">
                {t.hero.status}
              </span>
            </div>
          </motion.div>

          {/* Main Title - Brutalist Typography */}
          <motion.h1 variants={itemVariants} className="mb-6">
            <span className="block font-display text-[clamp(3rem,12vw,10rem)] leading-[0.85] tracking-tight text-[var(--foreground)]">
              {t.hero.title1}
            </span>
            <span className="block font-display text-[clamp(3rem,12vw,10rem)] leading-[0.85] tracking-tight">
              <span className="neon-text">{t.hero.title2Highlight}</span>
              <span className="text-[var(--foreground)] ml-4">{t.hero.title2}</span>
            </span>
          </motion.h1>

          {/* Subtext with vertical line accent */}
          <motion.div variants={itemVariants} className="flex items-start gap-6 mb-12 max-w-xl">
            <div className="w-[2px] h-24 bg-gradient-to-b from-primary to-transparent flex-shrink-0 mt-1" />
            <p className="font-mono text-sm md:text-base text-[var(--foreground-dim)] leading-relaxed">
              {t.hero.description}{" "}
              <span className="text-primary">{t.hero.descriptionHighlight}</span>
            </p>
          </motion.div>

          {/* CTA Buttons - Brutalist style */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
            <button
              onClick={() => document.getElementById("generator")?.scrollIntoView({ behavior: "smooth" })}
              className="group relative px-8 py-4 bg-primary text-black font-display text-sm tracking-widest overflow-hidden transition-all hover:pr-12"
            >
              <span className="relative z-10 flex items-center gap-3">
                <Sparkles className="w-5 h-5" />
                {t.hero.ctaCreate}
              </span>
              <motion.div
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <ArrowDown className="w-4 h-4 rotate-[-90deg]" />
              </motion.div>
            </button>

            <button className="group px-8 py-4 border-2 border-[var(--foreground-muted)] hover:border-[var(--primary-dim)] font-display text-sm tracking-widest text-[var(--foreground-dim)] hover:text-[var(--foreground)] transition-all flex items-center gap-3">
              <Cpu className="w-5 h-5 text-[var(--primary-dim)] group-hover:text-primary transition-colors" />
              {t.hero.ctaSpecs}
            </button>
          </motion.div>
        </div>

        {/* Decorative corner elements */}
        <div className="absolute top-24 right-12 hidden lg:block">
          <div className="w-32 h-32 border-t-2 border-r-2 border-[var(--border-color)]" />
        </div>
      </motion.div>

      {/* Bottom Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-0 left-0 right-0 border-t border-[var(--border-color)] bg-[var(--background)]/80 backdrop-blur-sm"
      >
        <div className="container px-6 md:px-12 py-4">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="font-mono text-xs">
                  <span className="text-[var(--foreground-muted)] mr-2">{stat.label}</span>
                  <span className="text-primary">{stat.value}</span>
                </div>
              ))}
            </div>
            <div className="font-mono text-xs text-[var(--foreground-muted)]">
              {t.hero.scrollHint} <span className="text-primary ml-2">↓</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Noise overlay */}
      <div className="noise-overlay" />
    </section>
  );
}
