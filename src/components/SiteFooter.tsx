import { Link } from "@tanstack/react-router";
import { Fork } from "@/components/icons";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground">
        <Link to="/" className="flex items-center gap-2 font-display text-lg text-foreground"><Fork className="h-5 w-5" /> Forkcast</Link>
        <nav className="flex gap-5">
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}

export function InfoPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center px-5 py-5">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl"><Fork className="h-6 w-6" /> Forkcast</Link>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 px-5 pb-20 pt-6 leading-relaxed">
        <h1 className="text-4xl md:text-5xl">{title}</h1>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
