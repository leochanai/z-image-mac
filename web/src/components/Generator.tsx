"use client";

import { motion } from "framer-motion";
import { Sparkles, Image as ImageIcon, Send } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Generator() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setGeneratedImage(null);
    
    try {
      const response = await fetch("http://127.0.0.1:8000/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          steps: 9,
          guidance: 0.0,
        }),
      });

      const data = await response.json();
      if (data.url) {
        setGeneratedImage(`http://127.0.0.1:8000${data.url}`);
      }
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
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
          className="glass p-2 rounded-2xl flex items-center gap-2 shadow-2xl shadow-primary/10 border border-white/10"
        >
          <div className="p-4 bg-white/5 rounded-xl">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A futuristic city with flying cars at sunset..."
            className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder:text-white/30 px-4"
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt}
            className={cn(
              "px-8 py-4 rounded-xl font-bold text-white transition-all duration-300 flex items-center gap-2",
              isGenerating || !prompt
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
