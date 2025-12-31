"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { getResourcesByCategory, type ResourceLink } from "@/lib/resources";

export function Resource() {
    const { t, locale } = useLocale();
    const resourcesByCategory = getResourcesByCategory(locale);

    return (
        <div className="min-h-screen bg-[var(--background)] pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-12"
                >
                    <div className="font-mono text-xs text-primary tracking-wider mb-4">
                        {t.resource.sectionLabel}
                    </div>
                    <h1 className="font-display text-6xl mb-4">
                        <span className="text-[var(--foreground)]">{t.resource.title} </span>
                        <span className="text-primary">{t.resource.titleHighlight}</span>
                    </h1>
                    <p className="text-[var(--foreground-dim)] text-lg max-w-2xl">
                        {t.resource.description}
                    </p>
                </motion.div>

                {/* Resource Grid */}
                <div className="space-y-12">
                    {Object.entries(resourcesByCategory).map(([category, links], categoryIndex) => {
                        if (links.length === 0) return null;

                        return (
                            <motion.div
                                key={category}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                            >
                                {/* Category Header */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="font-mono text-xs text-primary">
                                            {String(categoryIndex + 1).padStart(2, "0")}
                                        </div>
                                        <h2 className="font-display text-2xl text-[var(--foreground)]">
                                            {t.resource.categories[category as keyof typeof t.resource.categories]}
                                        </h2>
                                        <div className="flex-1 h-[1px] bg-gradient-to-r from-[var(--border-color)] to-transparent" />
                                    </div>
                                </div>

                                {/* Links Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {links.map((link, linkIndex) => (
                                        <ResourceCard
                                            key={link.url}
                                            link={link}
                                            index={linkIndex}
                                            visitLinkText={t.resource.visitLink}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

interface ResourceCardProps {
    link: ResourceLink;
    index: number;
    visitLinkText: string;
}

function ResourceCard({ link, index, visitLinkText }: ResourceCardProps) {
    return (
        <motion.a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            className="group relative block"
        >
            <div className="relative h-full bg-[var(--card-bg)] border-2 border-[var(--border-color)] p-6 transition-all duration-300 group-hover:border-primary group-hover:bg-[var(--primary-subtle)]">
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Content */}
                <div className="relative z-10">
                    <h3 className="font-display text-lg text-[var(--foreground)] mb-2 group-hover:text-primary transition-colors">
                        {link.title}
                    </h3>
                    <p className="text-sm text-[var(--foreground-dim)] mb-4 line-clamp-2">
                        {link.description}
                    </p>

                    {/* Link indicator */}
                    <div className="flex items-center gap-2 text-xs font-mono text-primary">
                        <span className="group-hover:translate-x-1 transition-transform duration-300">
                            {visitLinkText}
                        </span>
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                    </div>
                </div>

                {/* Background pattern */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `repeating-linear-gradient(
              0deg,
              var(--primary) 0px,
              transparent 1px,
              transparent 2px,
              var(--primary) 3px
            )`,
                    }} />
                </div>
            </div>

            {/* Bottom glow */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.a>
    );
}
