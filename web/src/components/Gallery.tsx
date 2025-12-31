"use client";

import { motion } from "framer-motion";
import { Download, Maximize2, Image as ImageIcon, Trash2, RotateCw, Wand2, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { useRouter } from "next/navigation";

interface Asset {
  name: string;
  url: string;
  path: string;
  metadata?: {
    prompt?: string;
    negative_prompt?: string;
    height?: string;
    width?: string;
    steps?: string;
    scale?: string;
    seed?: string;
    [key: string]: string | undefined;
  };
}

export function Gallery() {
  const { t } = useLocale();
  const router = useRouter();
  const [images, setImages] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [flippedId, setFlippedId] = useState<string | null>(null);



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

  const deleteImage = async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip
    if (!confirm(t.gallery.deleteConfirm || "Are you sure you want to delete this image?")) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/assets/${filename}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setImages(images.filter((img) => img.name !== filename));
      } else {
        console.error("Failed to delete image");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  const remixImage = (asset: Asset, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!asset.metadata) return;

    const meta = asset.metadata;
    const params = new URLSearchParams();

    // Ensure all values are strings and exist before setting
    if (meta.prompt) params.set("prompt", String(meta.prompt));
    if (meta.negative_prompt) params.set("negative_prompt", String(meta.negative_prompt));
    if (meta.width) params.set("width", String(meta.width));
    if (meta.height) params.set("height", String(meta.height));
    if (meta.steps) params.set("steps", String(meta.steps));
    if (meta.scale) params.set("guidance", String(meta.scale));
    if (meta.seed) params.set("seed", String(meta.seed));

    // Force full page load so Generator reads params from scratch
    window.location.href = `/?${params.toString()}`;
  };

  const editFromGallery = (asset: Asset, e: React.MouseEvent) => {
    e.stopPropagation();

    const params = new URLSearchParams();
    params.set("src", `http://127.0.0.1:8000${asset.url}`);

    const meta = asset.metadata;
    if (meta?.prompt) params.set("prompt", String(meta.prompt));
    if (meta?.negative_prompt) params.set("negative_prompt", String(meta.negative_prompt));

    router.push(`/edit?${params.toString()}`);
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

        {/* Queue Section */}


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
            {images.map((image) => (
              <div key={image.name} className="relative aspect-square perspective-1000 group">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    rotateY: flippedId === image.name ? 180 : 0
                  }}
                  whileHover={flippedId !== image.name ? {
                    y: -8,
                    rotateY: 3,
                    rotateX: -3,
                  } : {}}
                  transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                  className="w-full h-full relative preserve-3d cursor-pointer"
                  style={{ transformStyle: "preserve-3d", transformPerspective: 1000 }}
                  onClick={() => {
                    console.log("Card clicked:", image.name);
                    setFlippedId(flippedId === image.name ? null : image.name);
                  }}
                >
                  {/* Front Face */}
                  <div
                    className="absolute inset-0 backface-hidden rounded-lg overflow-hidden border-2 border-[var(--border-color)] bg-[var(--background)] group-hover:border-primary group-hover:shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all duration-300"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`http://127.0.0.1:8000${image.url}`}
                      alt={image.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <a
                        href={`http://127.0.0.1:8000${image.url}`}
                        download={image.name}
                        onClick={(e) => e.stopPropagation()}
                        className="p-3 bg-[var(--background)] border border-[var(--border-color)] hover:border-primary text-[var(--foreground)] hover:text-primary transition-all rounded-full"
                        title={t.gallery.download}
                      >
                        <Download className="w-5 h-5" />
                      </a>
                      <a
                        href={`http://127.0.0.1:8000${image.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-3 bg-[var(--background)] border border-[var(--border-color)] hover:border-primary text-[var(--foreground)] hover:text-primary transition-all rounded-full"
                        title={t.gallery.open}
                      >
                        <Maximize2 className="w-5 h-5" />
                      </a>
                      <button
                        onClick={(e) => deleteImage(image.name, e)}
                        className="p-3 bg-[var(--background)] border border-[var(--border-color)] hover:border-red-500 text-[var(--foreground)] hover:text-red-500 transition-all rounded-full"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Filename at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <p className="font-mono text-xs text-white truncate">{image.name}</p>
                    </div>
                  </div>

                  {/* Back Face */}
                  <div
                    className="absolute inset-0 backface-hidden rotate-y-180 rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)] p-6 flex flex-col"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--border-color)]">
                      <h3 className="font-mono text-sm text-primary">{t.gallery.info.title}</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => editFromGallery(image, e)}
                          className="group/edit p-2 hover:bg-[var(--primary-subtle)] rounded-md transition-all duration-300 text-[var(--foreground-muted)] hover:text-primary hover:scale-110 hover:shadow-[var(--glow-primary)]"
                          title={t.nav.edit}
                        >
                          <Pencil className="w-4 h-4 transition-transform duration-300 group-hover/edit:-rotate-12" />
                        </button>
                        <button
                          onClick={(e) => remixImage(image, e)}
                          className="group/remix p-2 hover:bg-[var(--primary-subtle)] rounded-md transition-all duration-300 text-[var(--foreground-muted)] hover:text-primary hover:scale-110 hover:shadow-[var(--glow-primary)]"
                          title={t.gallery.remix}
                        >
                          <Wand2 className="w-4 h-4 transition-transform duration-300 group-hover/remix:rotate-12" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 text-xs font-mono text-[var(--foreground-muted)] scrollbar-thin">
                      {image.metadata ? (
                        <>
                          <div>
                            <span className="text-[var(--foreground)] block mb-1">{t.gallery.info.prompt}:</span>
                            <p className="break-words">{image.metadata.prompt}</p>
                          </div>
                          {image.metadata.negative_prompt && (
                            <div>
                              <span className="text-[var(--foreground)] block mb-1">{t.gallery.info.negativePrompt}:</span>
                              <p className="break-words">{image.metadata.negative_prompt}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[var(--foreground)]">{t.gallery.info.size}:</span> {image.metadata.width}x{image.metadata.height}
                            </div>
                            <div>
                              <span className="text-[var(--foreground)]">{t.gallery.info.steps}:</span> {image.metadata.steps}
                            </div>
                            <div>
                              <span className="text-[var(--foreground)]">{t.gallery.info.scale}:</span> {image.metadata.scale}
                            </div>
                            <div>
                              <span className="text-[var(--foreground)]">{t.gallery.info.seed}:</span> {image.metadata.seed}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-[var(--foreground-muted)]">
                          <p>No metadata available</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex justify-center">
                      <button
                        className="text-xs text-[var(--foreground-muted)] hover:text-primary flex items-center gap-2 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setFlippedId(null); }}
                      >
                        <RotateCw className="w-3 h-3" /> {t.gallery.info.flipBack}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
