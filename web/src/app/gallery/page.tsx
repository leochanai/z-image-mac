import { Navbar } from "@/components/Navbar";
import { Gallery } from "@/components/Gallery";

export default function GalleryPage() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      <Gallery />
    </main>
  );
}
