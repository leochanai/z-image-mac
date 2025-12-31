import { Navbar } from "@/components/Navbar";
import { Resource } from "@/components/Resource";

export default function ResourcePage() {
    return (
        <main className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            <Navbar />
            <Resource />
        </main>
    );
}

