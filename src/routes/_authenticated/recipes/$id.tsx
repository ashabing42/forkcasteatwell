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
      <img src={r.image_url ?? ""} alt={r.title} className="-mx-4 aspect-[4/5] w-[calc(100%+2rem)] max-w-none bg-muted object-cover sm:aspect-[16/10] md:mx-0 md:w-full md:rounded-xl" />
      <div>
        <h1 className="text-4xl leading-tight md:text-5xl">{r.title}</h1>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {r.prep_minutes} min prep · {r.cook_minutes} min cook</span>
          <span className="flex items-center gap-1"><Users className="h-4 w-4" /> serves {r.servings}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3">{r.diet_tags.map((t) => <span key={t} className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{DIETS.find((d) => d.id === t)?.label ?? t}</span>)}</div>
      </div>
      {r.prep_tasks.length > 0 && (
        <div className="flex flex-wrap gap-2">{r.prep_tasks.map((t, i) => <span key={i} className="inline-flex items-center gap-1.5 rounded-md bg-tomato px-2.5 py-1 text-sm font-medium text-tomato-foreground tabular"><Bell className="h-3.5 w-3.5" /> {t.title} · {t.hours_before} h before</span>)}</div>
      )}
      <section><h2 className="mb-2 text-xl">Ingredients</h2>
        <ul>{r.ingredients.map((g, i) => <li key={i} className="dotted-rule flex justify-between py-2.5"><span>{g.name}</span><span className="text-muted-foreground tabular">{(() => { const m = toMetric(g.name, g.quantity, g.unit); return formatQty(m.quantity, m.unit); })()}</span></li>)}</ul></section>
      <section><h2 className="mb-2 text-xl">Steps</h2>
        <ol className="space-y-3">{r.steps.map((s, i) => <li key={i} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-display text-sm">{i + 1}</span><p className="pt-0.5">{s}</p></li>)}</ol></section>
      <div className="flex gap-2">
        <Button asChild variant="secondary" className="flex-1 rounded-lg"><Link to="/recipes/$id/edit" params={{ id: r.id }}><Pencil className="mr-1 h-4 w-4" /> Edit</Link></Button>
        <Button variant="outline" className="rounded-lg text-destructive" onClick={async () => { if (!confirm("Delete this recipe?")) return; await deleteRecipe(r.id); await qc.invalidateQueries({ queryKey: qk.recipes }); navigate({ to: "/recipes" }); }}><Trash2 className="mr-1 h-4 w-4" /> Delete</Button>
      </div>
    </article>
  );
}
