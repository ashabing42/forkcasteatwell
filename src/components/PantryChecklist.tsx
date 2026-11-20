import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { addPantryItem, qk, saveProfile } from "@/lib/api";

export const STARTER_GROUPS = [
  { title: "Oils & vinegars", items: ["olive oil", "sesame oil", "vinegar"] },
  { title: "Spices", items: ["salt", "black pepper", "cumin", "paprika", "dried oregano", "cinnamon"] },
  { title: "Sauces", items: ["soy sauce", "tamari (gluten-free soy sauce)", "tahini", "curry paste", "mustard"] },
  { title: "Tins & jars", items: ["canned tomatoes", "canned tuna", "chickpeas", "coconut milk"] },
  { title: "Grains & pasta", items: ["rice", "pasta", "red lentils", "rolled oats", "quinoa"] },
  { title: "Baking", items: ["flour", "baking powder", "honey"] },
  { title: "Freezer", items: ["frozen peas", "frozen chicken breast", "frozen prawns"] },
] as const;

export function PantryChecklist({ onDone }: { onDone: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  async function finish(skip = false) {
    setBusy(true);
    try {
      if (!skip) for (const name of selected) await addPantryItem(name, name.startsWith("frozen") ? "freezer" : "pantry");
      await saveProfile({ pantry_setup_done: true });
      await Promise.all([qc.invalidateQueries({ queryKey: qk.pantry }), qc.invalidateQueries({ queryKey: qk.profile })]);
      onDone();
    } catch { toast.error("Couldn't save your staples. Please try again."); }
    finally { setBusy(false); }
  }
  return <section className="space-y-5">
    <header><h2 className="text-2xl">What's already in your kitchen?</h2><p className="mt-1 text-sm text-muted-foreground">Tick everything you already have.</p></header>
    <div className="grid gap-5 sm:grid-cols-2">{STARTER_GROUPS.map((g) => <fieldset key={g.title}><legend className="mb-2 font-sans text-xs font-semibold uppercase text-muted-foreground">{g.title}</legend><div className="space-y-2">{g.items.map((name) => <label key={name} className="flex items-start gap-2 text-sm"><Checkbox disabled={busy} checked={selected.includes(name)} onCheckedChange={(on) => setSelected((old) => on ? [...old, name] : old.filter((n) => n !== name))} /><span>{name}</span></label>)}</div></fieldset>)}</div>
    <div className="flex flex-wrap gap-2"><Button disabled={busy || !selected.length} onClick={() => finish()}>{busy ? "Saving…" : `Add ${selected.length || ""} to pantry`}</Button><Button variant="ghost" disabled={busy} onClick={() => finish(true)}>Not now</Button></div>
  </section>;
}