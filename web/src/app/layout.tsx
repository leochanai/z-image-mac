import type { Metadata } from "next";
import { Orbitron, Space_Mono, Exo_2 } from "next/font/google";
import { Providers } from "@/contexts/Providers";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const exo2 = Exo_2({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Z-Image | AI 图片生成器",
  description: "使用最先进的 AI 生成惊艳的视觉作品。专为 macOS Silicon 优化。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning className={`${orbitron.variable} ${spaceMono.variable} ${exo2.variable}`}>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
