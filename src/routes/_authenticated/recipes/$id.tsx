import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Pencil, Trash2, Users, Bell } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useRecipes } from "@/hooks/use-mealmap";
import { deleteRecipe, qk } from "@/lib/api";
import { DIETS, formatQty, toMetric } from "@/lib/mealmap";

export const Route = createFileRoute("/_authenticated/recipes/$id")({
  head: () => ({ meta: [{ title: "Recipe — Forkcast" }, { name: "description", content: "Recipe details." }] }),
  component: RecipeView,
});

function RecipeView() {
  const { id } = Route.useParams();
  const { data = [] } = useRecipes();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const r = data.find((x) => x.id === id);
  if (!r) return <p className="text-muted-foreground">Loading recipe…</p>;
  return (
    <article className="space-y-6">
      <img src={r.image_url ?? ""} alt={r.title} className="aspect-[16/9] w-full rounded-xl bg-muted object-cover" />
      <div>
        <h1 className="text-3xl">{r.title}</h1>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {r.prep_minutes} min prep · {r.cook_minutes} min cook</span>
          <span className="flex items-center gap-1"><Users className="h-4 w-4" /> serves {r.servings}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">{r.diet_tags.map((t) => <span key={t} className="rounded-lg bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">{DIETS.find((d) => d.id === t)?.label ?? t}</span>)}</div>
      </div>
      {r.prep_tasks.length > 0 && (
        <div className="rounded-lg bg-accent p-4 text-sm">{r.prep_tasks.map((t, i) => <p key={i} className="flex items-center gap-2"><Bell className="h-4 w-4" /> {t.title}: {t.hours_before}h before</p>)}</div>
      )}
      <section><h2 className="mb-2 text-xl">Ingredients</h2>
        <ul className="divide-y rounded-lg border bg-card">{r.ingredients.map((g, i) => <li key={i} className="flex justify-between px-4 py-2.5"><span>{g.name}</span><span className="text-muted-foreground">{(() => { const m = toMetric(g.name, g.quantity, g.unit); return formatQty(m.quantity, m.unit); })()}</span></li>)}</ul></section>
      <section><h2 className="mb-2 text-xl">Steps</h2>
        <ol className="space-y-3">{r.steps.map((s, i) => <li key={i} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">{i + 1}</span><p className="pt-0.5">{s}</p></li>)}</ol></section>
      <div className="flex gap-2">
        <Button asChild variant="secondary" className="flex-1 rounded-lg"><Link to="/recipes/$id/edit" params={{ id: r.id }}><Pencil className="mr-1 h-4 w-4" /> Edit</Link></Button>
        <Button variant="outline" className="rounded-lg text-destructive" onClick={async () => { if (!confirm("Delete this recipe?")) return; await deleteRecipe(r.id); await qc.invalidateQueries({ queryKey: qk.recipes }); navigate({ to: "/recipes" }); }}><Trash2 className="mr-1 h-4 w-4" /> Delete</Button>
      </div>
    </article>
  );
}
