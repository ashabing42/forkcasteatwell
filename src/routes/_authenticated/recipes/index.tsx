import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRecipes } from "@/hooks/use-mealmap";
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
        <h1 className="text-3xl">Recipe book</h1>
        <Button asChild className="rounded-lg"><Link to="/recipes/$id/edit" params={{ id: "new" }}><Plus className="mr-1 h-4 w-4" /> Add recipe</Link></Button>
      </div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your recipes…" className="mb-5 h-11 rounded-lg" />
      {list.length === 0 && <p className="rounded-lg border border-dashed bg-card p-6 text-center text-muted-foreground">No recipes yet — add your favourite to get started!</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((r) => (
          <Link key={r.id} to="/recipes/$id" params={{ id: r.id }} className="overflow-hidden rounded-xl border bg-card">
            <img src={r.image_url ?? ""} alt="" className="aspect-[4/3] w-full bg-muted object-cover" loading="lazy" />
            <div className="p-4">
              <p className="font-display text-lg leading-snug">{r.title}</p>
              <div className="mt-2 flex flex-wrap gap-1">{r.diet_tags.map((t) => <span key={t} className="rounded-lg bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{DIETS.find((d) => d.id === t)?.label ?? t}</span>)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
