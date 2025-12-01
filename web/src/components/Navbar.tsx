"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Github } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4"
    >
      <div className="glass rounded-full px-6 py-3 flex items-center gap-8 shadow-2xl shadow-primary/10 border border-white/10">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-gradient-to-tr from-primary to-secondary p-2 rounded-full group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Z-Image
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/70">
          <Link href="#" className="hover:text-white transition-colors hover:glow-text">
            Gallery
          </Link>
          <Link href="#" className="hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#" className="hover:text-white transition-colors">
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="https://github.com/Tongyi-MAI/Z-Image-Turbo"
            target="_blank"
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Github className="w-5 h-5 text-white/80" />
          </Link>
          <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            Launch App
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
