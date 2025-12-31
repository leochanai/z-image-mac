import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      <Hero />
    </main>
  );
}
