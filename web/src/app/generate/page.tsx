import { Navbar } from "@/components/Navbar";
import { Generator } from "@/components/Generator";
import { Suspense } from "react";

export default function GeneratePage() {
    return (
        <main className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            <Navbar />
            <Suspense>
                <div className="pt-20">
                    <Generator />
                </div>
            </Suspense>
        </main>
    );
}
