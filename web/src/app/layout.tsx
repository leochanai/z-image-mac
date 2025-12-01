import type { Metadata } from "next";
import { Orbitron, Space_Mono } from "next/font/google";
import { Providers } from "@/contexts/Providers";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  fallback: ["Menlo", "Monaco", "Courier New", "monospace"],
});

export const metadata: Metadata = {
  title: "Z-Image | AI 图像生成器",
  description: "使用最先进的 AI 生成惊艳的视觉作品。专为 macOS Silicon 优化。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body
        className={`${orbitron.variable} ${spaceMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
