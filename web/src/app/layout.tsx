import type { Metadata } from "next";
import { Providers } from "@/contexts/Providers";
import "./globals.css";

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
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
