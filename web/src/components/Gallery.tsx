"use client";

import { motion } from "framer-motion";
import { Download, Maximize2, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";

interface Asset {
  name: string;
  url: string;
  path: string;
}

export function Gallery() {
  const { t } = useLocale();
  const [images, setImages] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/assets");
      if (response.ok) {
        const data = await response.json();
        setImages(data);
      }
    } catch (error) {
      console.error("Failed to fetch images:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen py-32 px-6 md:px-12 relative bg-[var(--background)]">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-transparent to-[var(--background)]" />
      
      <div className="container max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="h-[2px] w-12 bg-primary" />
            <span className="font-mono text-xs tracking-widest text-primary">02 // {t.nav.gallery}</span>
          </div>
          <h2 className="font-display text-4xl md:text-6xl tracking-tight text-[var(--foreground)]">
            {t.gallery.title} <span className="neon-text">{t.gallery.titleHighlight}</span>
          </h2>
        </motion.div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : images.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 border-2 border-dashed border-[var(--border-color)] flex items-center justify-center rounded-lg">
              <ImageIcon className="w-8 h-8 text-[var(--foreground-muted)]" />
            </div>
            <p className="font-mono text-lg text-[var(--foreground)] mb-2">{t.gallery.empty}</p>
            <p className="font-mono text-sm text-[var(--foreground-muted)]">{t.gallery.emptyHint}</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image, index) => (
              <motion.div
                key={image.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative aspect-square bg-[var(--background)] border border-[var(--border-color)] hover:border-primary transition-colors overflow-hidden rounded-lg"
              >
                {/* Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`http://127.0.0.1:8000${image.url}`}
                  alt={image.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <a
                    href={`http://127.0.0.1:8000${image.url}`}
                    download={image.name}
                    className="p-3 bg-[var(--background)] border border-[var(--border-color)] hover:border-primary text-[var(--foreground)] hover:text-primary transition-all rounded-full"
                    title={t.gallery.download}
                  >
                    <Download className="w-5 h-5" />
                  </a>
                  <a
                    href={`http://127.0.0.1:8000${image.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-[var(--background)] border border-[var(--border-color)] hover:border-primary text-[var(--foreground)] hover:text-primary transition-all rounded-full"
                    title={t.gallery.open}
                  >
                    <Maximize2 className="w-5 h-5" />
                  </a>
                </div>

                {/* Filename at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="font-mono text-xs text-white truncate">{image.name}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
