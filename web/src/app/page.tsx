import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Generator } from "@/components/Generator";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      <Hero />
      <Suspense>
        <Generator />
      </Suspense>
    </main>
  );
}
