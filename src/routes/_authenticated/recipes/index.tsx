import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRecipes } from "@/hooks/use-mealmap";
import { EmptyState } from "@/components/Doodle";
import { DIETS } from "@/lib/mealmap";

export const Route = createFileRoute("/_authenticated/recipes/")({
  head: () => ({ meta: [{ title: "Recipe book — Forkcast" }, { name: "description", content: "All your recipes in one place." }] }),
  component: Recipes,
});

function Recipes() {
  const { data = [] } = useRecipes();
  const [q, setQ] = useState("");
  const list = data.filter((r) => r.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-4xl">Recipe book</h1>
        <Button asChild className="rounded-lg"><Link to="/recipes/$id/edit" params={{ id: "new" }}><Plus className="mr-1 h-4 w-4" /> Add recipe</Link></Button>
      </div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your recipes…" className="mb-8 h-11 border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0" />
      {list.length === 0 && <EmptyState kind="book"><p>No recipes here yet. Add the one you always come back to.</p></EmptyState>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((r) => (
          <Link key={r.id} to="/recipes/$id" params={{ id: r.id }} className="group block">
            <img src={r.image_url ?? ""} alt="" className="aspect-[4/5] w-full rounded-xl bg-muted object-cover" loading="lazy" />
            <div className="pt-3">
              <p className="font-display text-xl leading-snug">{r.title}</p>
              <div className="mt-1 flex flex-wrap gap-x-2">{r.diet_tags.map((t) => <span key={t} className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{DIETS.find((d) => d.id === t)?.label ?? t}</span>)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
