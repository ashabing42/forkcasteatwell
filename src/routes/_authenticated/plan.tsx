import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, LockOpen, RefreshCw, Shuffle, Sparkles, X, Clock } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { WeekNav } from "@/components/WeekNav";
import { usePlan, useRecipes, useSavePlan } from "@/hooks/use-mealmap";
import { generatePlan, matchesDiet, matchesMeal, MEAL_LABEL, parseISODate, surpriseFor, weekStartOf, type Recipe, type Slot } from "@/lib/mealmap";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/plan")({
  validateSearch: z.object({ week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }),
  head: () => ({ meta: [{ title: "Weekly plan — MealMap" }, { name: "description", content: "Your week of meals, matched to your diet." }] }),
  component: PlanPage,
});

function PlanPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/plan" });
  const week = search.week ?? weekStartOf(new Date());
  const { profile, slots, exists } = usePlan(week);
  const recipes = useRecipes();
  const save = useSavePlan(week);
  const [swapping, setSwapping] = useState<Slot | null>(null);

  const list = recipes.data ?? [];
  const byId = new Map(list.map((r) => [r.id, r]));
  const diets = profile.data?.diets ?? [];
  const hasAny = slots.some((s) => s.recipe_id);

  const update = (next: Slot[]) => save.mutate({ slots: next });
  const setSlot = (slot: Slot, patch: Partial<Slot>) => update(slots.map((s) => (s.date === slot.date && s.meal === slot.meal ? { ...s, ...patch } : s)));

  function generate() {
    const next = generatePlan(slots, list, diets);
    if (next.every((s) => !s.recipe_id)) {
      toast("No recipes match your diet yet — add a few in Recipes and try again.");
      return;
    }
    update(next);
    toast.success(hasAny ? "Fresh picks for everything you didn't lock!" : "Your week is ready 🎉");
  }

  const days = [...new Set(slots.map((s) => s.date))];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">Your week</h1>
          <p className="text-sm text-muted-foreground">Lock what you love, reshuffle the rest.</p>
        </div>
        <WeekNav week={week} onChange={(w) => navigate({ search: { week: w } })} />
      </div>

      <Button size="lg" onClick={generate} disabled={!profile.data || recipes.isLoading} className="mb-6 h-12 w-full rounded-full text-base sm:w-auto sm:px-8">
        {hasAny ? <><RefreshCw className="mr-2 h-5 w-5" /> Regenerate unlocked meals</> : <><Sparkles className="mr-2 h-5 w-5" /> Generate my week</>}
      </Button>

      {!exists && !hasAny && (
        <div className="mb-6 rounded-2xl border border-dashed bg-card p-6 text-center text-muted-foreground">
          Nothing planned for this week yet. Tap <span className="font-medium text-foreground">Generate my week</span> and we'll do the thinking.
        </div>
      )}

      <div className="space-y-6">
        {days.map((date) => (
          <section key={date}>
            <h2 className="mb-2 text-lg">{parseISODate(date).toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {slots.filter((s) => s.date === date).map((slot) => {
                const r = slot.recipe_id ? byId.get(slot.recipe_id) : undefined;
                return (
                  <div key={slot.meal} className={cn("overflow-hidden rounded-2xl border bg-card shadow-soft", slot.locked && "ring-2 ring-primary")}>
                    {r ? (
                      <Link to="/recipes/$id" params={{ id: r.id }} className="block">
                        <img src={r.image_url ?? ""} alt="" className="aspect-[16/10] w-full bg-muted object-cover" loading="lazy" />
                      </Link>
                    ) : (
                      <div className="flex aspect-[16/10] items-center justify-center bg-muted text-sm text-muted-foreground">Empty slot</div>
                    )}
                    <div className="p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{MEAL_LABEL[slot.meal]}</p>
                      <p className="mt-0.5 line-clamp-2 font-medium leading-snug">{r?.title ?? "Pick something tasty"}</p>
                      {r && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {r.prep_minutes + r.cook_minutes} min{r.prep_tasks.length > 0 && " · has prep"}</p>}
                      <div className="mt-3 flex gap-1.5">
                        <Button size="sm" variant="secondary" className="flex-1 rounded-full" onClick={() => setSwapping(slot)}>Swap</Button>
                        <Button size="icon" variant={slot.locked ? "default" : "secondary"} className="h-8 w-8 rounded-full" aria-label={slot.locked ? "Unlock" : "Lock"} onClick={() => setSlot(slot, { locked: !slot.locked })} disabled={!r}>
                          {slot.locked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <SwapDialog
        slot={swapping}
        recipes={list}
        diets={diets}
        onClose={() => setSwapping(null)}
        onPick={(id) => { if (swapping) setSlot(swapping, { recipe_id: id }); setSwapping(null); }}
        onSurprise={() => {
          if (!swapping) return;
          const id = surpriseFor(swapping, slots, list, diets);
          if (id) setSlot(swapping, { recipe_id: id });
          else toast("That's the only match for now — add more recipes for variety!");
          setSwapping(null);
        }}
      />
    </div>
  );
}

function SwapDialog({ slot, recipes, diets, onClose, onPick, onSurprise }: { slot: Slot | null; recipes: Recipe[]; diets: string[]; onClose: () => void; onPick: (id: string | null) => void; onSurprise: () => void }) {
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);
  if (!slot) return null;
  const options = recipes
    .filter((r) => (all ? true : matchesDiet(r, diets) && matchesMeal(r, slot.meal)))
    .filter((r) => r.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-hidden rounded-3xl p-0 sm:max-w-lg">
        <DialogHeader className="px-5 pt-5"><DialogTitle className="font-display text-xl">Swap {(MEAL_LABEL[slot.meal] ?? "meal").toLowerCase()}</DialogTitle></DialogHeader>
        <div className="space-y-3 px-5">
          <Button onClick={onSurprise} className="w-full rounded-full"><Shuffle className="mr-2 h-4 w-4" /> Surprise me</Button>
          <Input placeholder="Search recipes…" value={q} onChange={(e) => setQ(e.target.value)} className="rounded-xl" />
          <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> Show all recipes, not just matches</label>
        </div>
        <div className="max-h-[45vh] space-y-2 overflow-y-auto px-5 pb-5">
          {options.map((r) => (
            <button key={r.id} onClick={() => onPick(r.id)} className={cn("flex w-full items-center gap-3 rounded-2xl border p-2 text-left hover:border-primary", r.id === slot.recipe_id && "border-primary bg-secondary")}>
              <img src={r.image_url ?? ""} alt="" className="h-14 w-14 rounded-xl bg-muted object-cover" />
              <span className="flex-1 text-sm font-medium">{r.title}</span>
            </button>
          ))}
          {options.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No matches — try showing all recipes.</p>}
          {slot.recipe_id && <Button variant="ghost" className="w-full rounded-full text-muted-foreground" onClick={() => onPick(null)}><X className="mr-1 h-4 w-4" /> Leave this slot empty</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
