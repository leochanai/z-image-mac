"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Github, Terminal } from "lucide-react";

export function Navbar() {
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
          className="group flex items-center gap-3 px-6 py-4 bg-black border-b-2 border-r-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-300"
        >
          <div className="relative">
            <Zap className="w-6 h-6 text-primary" />
            <div className="absolute inset-0 blur-md bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="font-display text-xl tracking-wider text-white group-hover:text-primary transition-colors">
            Z-IMAGE
          </span>
        </Link>

        {/* Navigation Links - Horizontal bar */}
        <div className="hidden md:flex items-center border-b-2 border-primary/30 bg-black/80 backdrop-blur-sm">
          {["GENERATE", "GALLERY", "DOCS"].map((item, i) => (
            <Link
              key={item}
              href={item === "GENERATE" ? "#generator" : "#"}
              className="relative px-6 py-4 font-mono text-xs tracking-widest text-white/50 hover:text-primary transition-colors group"
            >
              <span className="relative z-10">
                <span className="text-primary/50 mr-1">{String(i + 1).padStart(2, '0')}</span>
                {item}
              </span>
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Link>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1 border-b-2 border-primary/10 bg-gradient-to-r from-black/80 to-transparent" />

        {/* Right Actions - Sharp corners */}
        <div className="flex items-stretch">
          <Link
            href="https://github.com/Tongyi-MAI/Z-Image-Turbo"
            target="_blank"
            className="flex items-center px-5 border-b-2 border-l-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all bg-black"
          >
            <Github className="w-5 h-5 text-white/60 hover:text-primary transition-colors" />
          </Link>
          <button 
            onClick={() => document.getElementById("generator")?.scrollIntoView({ behavior: "smooth" })}
            className="group flex items-center gap-2 px-6 py-4 bg-primary text-black font-display text-sm tracking-wider hover:bg-primary/90 transition-colors border-b-2 border-primary"
          >
            <Terminal className="w-4 h-4" />
            <span>LAUNCH</span>
          </button>
        </div>
      </div>

      {/* Decorative scan line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </motion.nav>
  );
}
