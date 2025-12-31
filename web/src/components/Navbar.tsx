"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Github, Sun, Moon, Languages } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { locale, setLocale, t } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { key: "generate", label: t.nav.generate, href: "/generate" },
    { key: "edit", label: t.nav.edit, href: "/edit" },
    { key: "gallery", label: t.nav.gallery, href: "/gallery" },
    { key: "resource", label: t.nav.resource, href: "/resource" },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      {/* Asymmetric container - aligned left */}
      <div className="flex items-stretch">
        {/* Logo Block - Sharp edge */}
        <Link
          href="/"
          className="group flex items-center gap-3 px-6 py-4 bg-[var(--background)] border-b-2 border-r-2 border-[var(--border-color)] hover:border-primary hover:bg-[var(--primary-subtle)] transition-all duration-300"
        >
          <div className="relative">
            <Zap className="w-6 h-6 text-primary" />
            <div className="absolute inset-0 blur-md bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="font-display text-xl tracking-wider text-[var(--foreground)] group-hover:text-primary transition-colors">
            Z-IMAGE
          </span>
        </Link>


        {/* Navigation Links - Horizontal bar */}
        <div className="hidden md:flex items-center border-b-2 border-[var(--border-color)] bg-[var(--background)]/80 backdrop-blur-sm">
          {navItems.map((item, i) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "relative px-6 py-4 font-mono text-xs tracking-widest transition-colors duration-300 group overflow-hidden",
                  isActive
                    ? "text-primary bg-[var(--primary-subtle)]"
                    : "text-[var(--foreground-dim)] hover:text-primary"
                )}
              >
                <span className="relative z-10 flex items-center gap-1">
                  <span
                    className={cn(
                      "transition-colors duration-300",
                      isActive ? "text-primary" : "text-primary/50 group-hover:text-primary"
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="group-hover:translate-x-0.5 transition-transform duration-300">
                    {item.label}
                  </span>
                </span>
                <div
                  className={cn(
                    "absolute inset-0 transition-colors duration-300",
                    isActive
                      ? "bg-[var(--primary-subtle)]"
                      : "bg-primary/0 group-hover:bg-[var(--primary-subtle)]"
                  )}
                />
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary origin-left"
                  initial={{ scaleX: isActive ? 1 : 0 }}
                  animate={{ scaleX: isActive ? 1 : 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </Link>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1 border-b-2 border-[var(--primary-subtle)] bg-gradient-to-r from-[var(--background)]/80 to-transparent" />

        {/* Right Actions - Sharp corners */}
        <div className="flex items-stretch">
          {/* Language Toggle */}
          <button
            onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
            className="flex items-center gap-2 px-4 border-b-2 border-l-2 border-[var(--border-color)] hover:border-primary hover:bg-[var(--primary-subtle)] transition-all bg-[var(--background)]"
            title={locale === "zh" ? "Switch to English" : "切换到中文"}
          >
            <Languages className="w-4 h-4 text-[var(--foreground-dim)]" />
            <span className="font-mono text-xs text-[var(--foreground-dim)] hidden sm:inline">
              {locale === "zh" ? "EN" : "中"}
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center px-4 border-b-2 border-l-2 border-[var(--border-color)] hover:border-primary hover:bg-[var(--primary-subtle)] transition-all bg-[var(--background)]"
            title={theme === "dark" ? t.theme.light : t.theme.dark}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-[var(--foreground-dim)] hover:text-primary transition-colors" />
            ) : (
              <Moon className="w-4 h-4 text-[var(--foreground-dim)] hover:text-primary transition-colors" />
            )}
          </button>

          {/* GitHub Link */}
          <Link
            href="https://github.com/leochanai/z-image-mac"
            target="_blank"
            className="flex items-center px-5 border-b-2 border-l-2 border-[var(--border-color)] hover:border-primary hover:bg-[var(--primary-subtle)] transition-all bg-[var(--background)]"
          >
            <Github className="w-5 h-5 text-[var(--foreground-dim)] hover:text-primary transition-colors" />
          </Link>


        </div>
      </div>

      {/* Decorative scan line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </motion.nav>
  );
}
