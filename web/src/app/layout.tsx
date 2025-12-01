import type { Metadata } from "next";
import { Orbitron, Space_Mono } from "next/font/google";
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
  title: "Z-Image | AI Image Generator",
  description: "Generate breathtaking visuals with state-of-the-art AI. Optimized for macOS Silicon.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${orbitron.variable} ${spaceMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
