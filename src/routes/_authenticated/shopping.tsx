import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { WeekNav } from "@/components/WeekNav";
import { usePlan, useRecipes, useSavePlan } from "@/hooks/use-mealmap";
import { addCustomItem, deleteCustomItem, fetchCustomItems, qk, toggleCustomItem } from "@/lib/api";
import { buildShoppingList, CATEGORIES, CATEGORY_LABEL, formatQty, weekStartOf } from "@/lib/mealmap";

export const Route = createFileRoute("/_authenticated/shopping")({
  head: () => ({ meta: [{ title: "Shopping list — MealMap" }, { name: "description", content: "Your week's groceries, grouped by aisle." }] }),
  component: Shopping,
});

function Shopping() {
  const [week, setWeek] = useState(weekStartOf(new Date()));
  const { profile, slots, checked } = usePlan(week);
  const recipes = useRecipes().data ?? [];
  const save = useSavePlan(week);
  const qc = useQueryClient();
  const custom = useQuery({ queryKey: qk.custom(week), queryFn: () => fetchCustomItems(week) });
  const [name, setName] = useState("");
  const lines = buildShoppingList(slots, recipes, profile.data?.servings ?? 2);
  const refresh = () => qc.invalidateQueries({ queryKey: qk.custom(week) });
  const toggle = (key: string) => save.mutate({ slots, checked_keys: checked.includes(key) ? checked.filter((k) => k !== key) : [...checked, key] });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl">Shopping list</h1><p className="text-sm text-muted-foreground">For {profile.data?.servings ?? "…"} people · {lines.length} items</p></div>
        <WeekNav week={week} onChange={setWeek} />
      </div>
      <form className="mb-6 flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (!name.trim()) return; await addCustomItem(week, name.trim(), "other"); setName(""); refresh(); }}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add something else… (e.g. coffee)" className="h-11 rounded-full" />
        <Button type="submit" size="icon" className="h-11 w-11 shrink-0 rounded-full" aria-label="Add item"><Plus className="h-5 w-5" /></Button>
      </form>
      {lines.length === 0 && (custom.data ?? []).length === 0 && <p className="rounded-2xl border border-dashed bg-card p-6 text-center text-muted-foreground">Your list fills itself once you plan the week. 🛒</p>}
      <div className="space-y-6">
        {CATEGORIES.map((cat) => {
          const items = lines.filter((l) => l.category === cat);
          const extras = (custom.data ?? []).filter((c) => c.category === cat);
          if (!items.length && !extras.length) return null;
          return (
            <section key={cat}>
              <h2 className="mb-2 text-lg">{CATEGORY_LABEL[cat]}</h2>
              <ul className="divide-y rounded-2xl border bg-card">
                {items.map((l) => { const on = checked.includes(l.key); return (
                  <li key={l.key}><label className="flex items-center gap-3 px-4 py-3">
                    <Checkbox checked={on} onCheckedChange={() => toggle(l.key)} className="h-5 w-5 rounded-full" />
                    <span className={on ? "flex-1 text-muted-foreground line-through" : "flex-1"}>{l.name}</span>
                    <span className="text-sm text-muted-foreground">{formatQty(l.quantity, l.unit)}</span>
                  </label></li>); })}
                {extras.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                    <Checkbox checked={c.checked} onCheckedChange={async (v) => { await toggleCustomItem(c.id, !!v); refresh(); }} className="h-5 w-5 rounded-full" />
                    <span className={c.checked ? "flex-1 text-muted-foreground line-through" : "flex-1"}>{c.name}</span>
                    <button aria-label="Remove" onClick={async () => { await deleteCustomItem(c.id); refresh(); }}><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
