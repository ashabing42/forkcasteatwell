import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Sparkles, X } from "@/components/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRecipes } from "@/hooks/use-mealmap";
import { qk, saveRecipe, type RecipeInput } from "@/lib/api";
import { CATEGORIES, CATEGORY_LABEL, DIET_TAGS, MEALS, MEAL_LABEL, guessCategory, suggestDietTags, suggestPrepTasks } from "@/lib/mealmap";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/recipes/$id_/edit")({
  head: () => ({ meta: [{ title: "Edit recipe — MealMap" }, { name: "description", content: "Add or edit a recipe." }] }),
  component: EditPage,
});

const EMPTY: RecipeInput = { title: "", image_url: "", servings: 2, prep_minutes: 10, cook_minutes: 20, diet_tags: [], meal_types: ["dinner"], ingredients: [{ name: "", quantity: 1, unit: "", category: "produce" }], steps: [""], prep_tasks: [] };

function EditPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useRecipes();
  if (isLoading) return null;
  const existing = id === "new" ? undefined : data?.find((r) => r.id === id);
  return <RecipeForm id={existing ? id : null} initial={existing ?? EMPTY} />;
}

function RecipeForm({ id, initial }: { id: string | null; initial: RecipeInput }) {
  const [r, setR] = useState<RecipeInput>(initial);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const set = (p: Partial<RecipeInput>) => setR((x) => ({ ...x, ...p }));
  const toggle = (k: "diet_tags" | "meal_types", v: string) => set({ [k]: r[k].includes(v) ? r[k].filter((x) => x !== v) : [...r[k], v] });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = { ...r, ingredients: r.ingredients.filter((i) => i.name.trim()), steps: r.steps.filter((s) => s.trim()), prep_tasks: r.prep_tasks.filter((t) => t.title.trim()) };
    try {
      const saved = await saveRecipe(id, clean);
      await qc.invalidateQueries({ queryKey: qk.recipes });
      toast.success("Recipe saved — yum!");
      navigate({ to: "/recipes/$id", params: { id: saved } });
    } catch (err) { toast.error((err as Error).message); }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <h1 className="text-3xl">{id ? "Edit recipe" : "New recipe"}</h1>
      <Input required placeholder="Recipe title" value={r.title} onChange={(e) => set({ title: e.target.value })} className="h-12 rounded-xl text-lg" />
      <Input placeholder="Photo URL (optional)" value={r.image_url ?? ""} onChange={(e) => set({ image_url: e.target.value })} className="rounded-xl" />
      <div className="grid grid-cols-3 gap-2">
        {([["servings", "Servings"], ["prep_minutes", "Prep min"], ["cook_minutes", "Cook min"]] as const).map(([k, l]) => (
          <label key={k} className="text-sm font-medium">{l}<Input type="number" min={0} value={r[k]} onChange={(e) => set({ [k]: Number(e.target.value) })} className="mt-1 rounded-xl" /></label>
        ))}
      </div>
      <section><h2 className="mb-2 text-lg">Good for</h2><div className="flex flex-wrap gap-2">{MEALS.map((m) => <Chip key={m} on={r.meal_types.includes(m)} onClick={() => toggle("meal_types", m)}>{MEAL_LABEL[m]}</Chip>)}</div></section>
      <section>
        <h2 className="mb-2 text-lg">Ingredients</h2>
        <div className="space-y-2">
          {r.ingredients.map((g, i) => (
            <div key={i} className="grid grid-cols-[1fr_4rem_4rem_auto] gap-2 sm:grid-cols-[1fr_5rem_5rem_9rem_auto]">
              <Input placeholder="Ingredient" value={g.name} onChange={(e) => set({ ingredients: r.ingredients.map((x, j) => (j === i ? { ...x, name: e.target.value, category: x.name ? x.category : guessCategory(e.target.value) } : x)) })} className="rounded-xl" />
              <Input type="number" step="any" placeholder="Qty" value={g.quantity ?? ""} onChange={(e) => set({ ingredients: r.ingredients.map((x, j) => (j === i ? { ...x, quantity: e.target.value === "" ? null : Number(e.target.value) } : x)) })} className="rounded-xl" />
              <Input placeholder="Unit" value={g.unit} onChange={(e) => set({ ingredients: r.ingredients.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)) })} className="rounded-xl" />
              <select value={g.category} onChange={(e) => set({ ingredients: r.ingredients.map((x, j) => (j === i ? { ...x, category: e.target.value } : x)) })} className="col-span-3 rounded-xl border bg-card px-2 text-sm sm:col-span-1">{CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}</select>
              <Button type="button" size="icon" variant="ghost" aria-label="Remove" onClick={() => set({ ingredients: r.ingredients.filter((_, j) => j !== i) })}><X className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" className="rounded-full" onClick={() => set({ ingredients: [...r.ingredients, { name: "", quantity: null, unit: "", category: "produce" }] })}><Plus className="mr-1 h-4 w-4" /> Ingredient</Button>
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-lg">Steps</h2>
        <div className="space-y-2">
          {r.steps.map((s, i) => <Textarea key={i} rows={2} value={s} placeholder={`Step ${i + 1}`} onChange={(e) => set({ steps: r.steps.map((x, j) => (j === i ? e.target.value : x)) })} className="rounded-xl" />)}
          <Button type="button" variant="secondary" size="sm" className="rounded-full" onClick={() => set({ steps: [...r.steps, ""] })}><Plus className="mr-1 h-4 w-4" /> Step</Button>
        </div>
      </section>
      <section>
        <div className="mb-2 flex items-center justify-between"><h2 className="text-lg">Diet tags</h2>
          <Button type="button" variant="ghost" size="sm" onClick={() => set({ diet_tags: suggestDietTags(r.ingredients.filter((g) => g.name)) })}><Sparkles className="mr-1 h-4 w-4" /> Suggest</Button></div>
        <div className="flex flex-wrap gap-2">{DIET_TAGS.map((d) => <Chip key={d.id} on={r.diet_tags.includes(d.id)} onClick={() => toggle("diet_tags", d.id)}>{d.label}</Chip>)}</div>
      </section>
      <section>
        <div className="mb-2 flex items-center justify-between"><h2 className="text-lg">Prep reminders</h2>
          <Button type="button" variant="ghost" size="sm" onClick={() => { const s = suggestPrepTasks(r.ingredients, r.steps); set({ prep_tasks: s }); if (!s.length) toast("No prep needed that we can spot."); }}><Sparkles className="mr-1 h-4 w-4" /> Suggest</Button></div>
        <div className="space-y-2">
          {r.prep_tasks.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={t.title} placeholder="e.g. Thaw chicken" onChange={(e) => set({ prep_tasks: r.prep_tasks.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} className="rounded-xl" />
              <Input type="number" min={0} value={t.hours_before} onChange={(e) => set({ prep_tasks: r.prep_tasks.map((x, j) => (j === i ? { ...x, hours_before: Number(e.target.value) } : x)) })} className="w-20 rounded-xl" />
              <span className="text-sm text-muted-foreground">h before</span>
              <Button type="button" size="icon" variant="ghost" aria-label="Remove" onClick={() => set({ prep_tasks: r.prep_tasks.filter((_, j) => j !== i) })}><X className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" className="rounded-full" onClick={() => set({ prep_tasks: [...r.prep_tasks, { title: "", hours_before: 2 }] })}><Plus className="mr-1 h-4 w-4" /> Reminder</Button>
        </div>
      </section>
      <Button type="submit" size="lg" className="h-12 w-full rounded-full">Save recipe</Button>
    </form>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("rounded-full border px-4 py-2 text-sm", on ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>{children}</button>;
}
