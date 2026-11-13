import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addCustomItem, addPantryItem, deletePantryItem, fetchPantry, qk } from "@/lib/api";
import { guessCategory, weekStartOf } from "@/lib/mealmap";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pantry")({
  head: () => ({ meta: [{ title: "Pantry & freezer — MealMap" }, { name: "description", content: "Keep track of what you already have at home." }] }),
  component: Pantry,
});

const LOCS = [{ id: "pantry", label: "Pantry" }, { id: "freezer", label: "Freezer" }] as const;

function Pantry() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: qk.pantry, queryFn: fetchPantry });
  const [loc, setLoc] = useState<string>("pantry");
  const [name, setName] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: qk.pantry });
  const items = data.filter((i) => i.location === loc);
  const week = weekStartOf(new Date());

  return (
    <div>
      <h1 className="text-3xl">Pantry & freezer</h1>
      <p className="mb-5 text-sm text-muted-foreground">Things you have at home won't land on your shopping list.</p>
      <div className="mb-5 inline-flex rounded-full bg-secondary p-1">
        {LOCS.map((l) => (
          <button key={l.id} onClick={() => setLoc(l.id)} className={cn("rounded-full px-5 py-1.5 text-sm font-medium", loc === l.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
            {l.label} ({data.filter((i) => i.location === l.id).length})
          </button>
        ))}
      </div>
      <form className="mb-6 flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (!name.trim()) return; await addPantryItem(name.trim(), loc); setName(""); refresh(); }}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={loc === "pantry" ? "Add to pantry… (e.g. dried oregano)" : "Add to freezer… (e.g. frozen peas)"} className="h-11 rounded-full" />
        <Button type="submit" size="icon" className="h-11 w-11 shrink-0 rounded-full" aria-label="Add"><Plus className="h-5 w-5" /></Button>
      </form>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed bg-card p-6 text-center text-muted-foreground">Nothing here yet. Add what you have, or tap "I have this" on your shopping list. 🫙</p>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-2 px-4 py-3">
              <span className="flex-1">{i.name}</span>
              <Button size="sm" variant="secondary" className="rounded-full" onClick={async () => {
                await addCustomItem(week, i.name, guessCategory(i.name));
                await deletePantryItem(i.id);
                refresh(); qc.invalidateQueries({ queryKey: qk.custom(week) });
                toast.success(`${i.name} added to this week's shopping list`);
              }}><ShoppingCart className="h-4 w-4" /> Ran out</Button>
              <button aria-label="Remove" className="p-2" onClick={async () => { await deletePantryItem(i.id); refresh(); }}><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
