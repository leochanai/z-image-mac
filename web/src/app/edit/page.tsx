import { Navbar } from "@/components/Navbar";
import { Editor } from "@/components/Editor";
import { Suspense } from "react";

export default function EditPage() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      <Suspense>
        <Editor />
      </Suspense>
    </main>
  );
}
