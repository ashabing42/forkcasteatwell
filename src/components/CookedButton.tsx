import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { markMealCooked, qk } from "@/lib/api";
import type { Recipe, Slot } from "@/lib/mealmap";

export function CookedButton({ week, slot, recipe }: { week: string; slot: Slot; recipe: Recipe }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  return <Button size="sm" variant="outline" disabled={busy || slot.cooked} aria-label={`${slot.cooked ? "Cooked" : "Mark cooked"}: ${recipe.title}`} title="Uses up fresh items recorded at home; keeps oils, spices and other staples" onClick={async () => {
    setBusy(true);
    try {
      await markMealCooked(week, slot, recipe);
      await Promise.all([qc.invalidateQueries({ queryKey: qk.plan(week) }), qc.invalidateQueries({ queryKey: qk.pantry })]);
      toast.success("Meal cooked. Used fresh items removed from pantry; staples kept.");
    } catch { toast.error("Couldn't mark this meal cooked. Please try again."); }
    finally { setBusy(false); }
  }}><Check className="mr-1 h-4 w-4" />{slot.cooked ? "Cooked" : busy ? "Saving…" : "Mark cooked"}</Button>;
}