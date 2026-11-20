import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lock, LockOpen, RefreshCw, Shuffle, X, Clock, Repeat, SlidersHorizontal } from "@/components/icons";
import { ProfileForm } from "@/components/ProfileForm";
import { RecipeImage } from "@/components/RecipeImage";
import { PrepTag } from "@/components/PrepTag";
import { NutritionLine } from "@/components/NutritionLine";
import { CookedButton } from "@/components/CookedButton";
import { fetchPreviousSettings, qk, type WeekSettings } from "@/lib/api";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CalendarConnect } from "@/components/CalendarConnect";
import { WeekNav } from "@/components/WeekNav";
import { useActivePlan, usePlan, usePrepSchedule, useRecipes, useSavePlan } from "@/hooks/use-mealmap";
import { DIETS, buildEmptySlots, reconcileSlots, generatePlan, matchesDiet, matchesMeal, sameWeekSettings, planningShortages, nutritionSummary, planStartDate, MEAL_LABEL, parseISODate, surpriseFor, toISODate, weekStartOf, type Recipe, type Slot } from "@/lib/mealmap";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/plan")({
  validateSearch: z.object({ week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }),
  head: () => ({ meta: [{ title: "Weekly plan — Forkcast" }, { name: "description", content: "Your week of meals, matched to your diet." }, { property: "og:title", content: "Weekly plan — Forkcast" }, { property: "og:description", content: "Your week of meals, matched to your diet." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: PlanPage,
});

function PlanPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/plan" });
  const active = useActivePlan();
  const week = search.week ?? active.week;
  const { profile, slots, settings, hasWeekSettings } = usePlan(week);
  const prev = useQuery({ queryKey: qk.prevSettings(week), queryFn: () => fetchPreviousSettings(week) });
  const [editing, setEditing] = useState(false);
  const recipes = useRecipes();
  const save = useSavePlan(week);
  const prep = usePrepSchedule(week);
  const [swapping, setSwapping] = useState<Slot | null>(null);
  const [askCalendar, setAskCalendar] = useState(false);

  const list = recipes.data ?? [];
  const byId = new Map(list.map((r) => [r.id, r]));
  const diets = settings?.diets ?? [];
  const hasAny = slots.some((s) => s.recipe_id);
  const summary = nutritionSummary(slots, list);
  const shortages = planningShortages(slots, list, diets);
  const dietLabel = diets.map((d) => DIETS.find((x) => x.id === d)?.label ?? d).join(" · ");
  const invalid = slots.some((s) => { const r = s.recipe_id ? byId.get(s.recipe_id) : undefined; return r && (!matchesDiet(r, diets) || !matchesMeal(r, s.meal)); });

  const update = (next: Slot[]) => save.mutate({ slots: next });
  const setSlot = (slot: Slot, patch: Partial<Slot>) => update(slots.map((s) => (s.date === slot.date && s.meal === slot.meal ? { ...s, ...patch } : s)));

  async function generate() {
    const next = generatePlan(slots, list, diets);
    if (next.every((s) => !s.recipe_id)) {
      toast("No recipes match your diet yet — add a few in Recipes and try again.");
      return;
    }
    try { await save.mutateAsync({ slots: next }); toast.success(hasAny ? "Fresh picks. Matching locks kept." : "Your week is sorted."); } catch { /* save hook reports the error */ }
  }

  const todayISO = toISODate(new Date());
  const days = [...new Set(slots.map((s) => s.date))];

  /** Save this week's answers and fill the week straight away (locked meals are kept). */
  async function planWeek(s: WeekSettings) {
    const base = hasAny ? reconcileSlots(week, s, slots) : buildEmptySlots(week, s);
    const next = generatePlan(base, list, s.diets);
    try { await save.mutateAsync({ settings: s, slots: next }); } catch { return; }
    setEditing(false);
    if (next.every((x) => !x.recipe_id)) toast("No recipes match that diet yet — add a few in Recipes and try again.");
    else setAskCalendar(true);
  }

  const showSetup = editing || (!hasWeekSettings && !hasAny);
  if (showSetup) {
    const p = profile.data;
    const start = editing ? settings : prev.data ?? settings;
    if (!p || !start || prev.isLoading || recipes.isLoading) return null;
    return (
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
             <h1 className="text-3xl">{editing ? "Just this week" : "Plan this week"}</h1>
             <p className="text-sm text-muted-foreground">{editing ? "Changes apply here only. Your usual week stays the same." : "A few quick answers and we'll fill your week."}</p>
          </div>
          <WeekNav week={week} start={planStartDate(week, start.start_day)} days={start.days} onChange={(w) => { setEditing(false); navigate({ search: { week: w } }); }} />
        </div>
        {prev.data && !editing && (
          <Button size="lg" disabled={save.isPending} onClick={() => { if (prev.data) void planWeek(prev.data); }} className="mb-8 h-12 w-full rounded-lg text-base">
            <Repeat className="mr-2 h-5 w-5" /> Same as last week
          </Button>
        )}
        {prev.data && !editing && <p className="mb-6 text-center text-sm text-muted-foreground">…or change anything below</p>}
        <ProfileForm
          key={week + String(editing)}
          initial={{ ...p, ...start }}
          submitLabel={editing ? "Update my week" : "Plan my week"}
          onSubmit={(d) => planWeek({ diets: d.diets, servings: d.servings, days: d.days, meals: d.meals, start_day: d.start_day ?? 0 })}
        />
        {editing && <Button variant="ghost" className="mt-3 w-full rounded-lg" onClick={() => setEditing(false)}>Cancel</Button>}
      </div>
    );
  }

  return (
    <div>
      <Dialog open={askCalendar} onOpenChange={setAskCalendar}>
        <DialogContent className="rounded-xl">
          <DialogHeader><DialogTitle>Your week is sorted</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Put this week's meals and prep reminders in your calendar. Already added it? You're all set, it updates by itself.</p>
          {profile.data && <CalendarConnect token={profile.data.calendar_token} compact />}
          <Button variant="outline" className="rounded-lg" onClick={() => setAskCalendar(false)}>Maybe later</Button>
        </DialogContent>
      </Dialog>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">Your week</h1>
           <p className="text-sm text-muted-foreground">Lock the keepers, reshuffle the rest.</p>
        </div>
        <WeekNav week={week} start={planStartDate(week, settings?.start_day)} days={settings?.days ?? 7} onChange={(w) => navigate({ search: { week: w } })} />
      </div>

      {settings && (
        <div className="mb-4 border-y py-3 text-sm">
          <p>This week: {dietLabel} <span className="text-muted-foreground">({profile.data && sameWeekSettings(settings, profile.data) ? "your defaults" : "changed for this week"})</span></p>
          <p className="mt-1 text-muted-foreground">{settings.servings} {settings.servings === 1 ? "person" : "people"} · {settings.days} {settings.days === 1 ? "day" : "days"} · {settings.meals.map((m) => MEAL_LABEL[m]).join(", ")}</p>
        </div>
      )}
      {summary && <div className="mb-5 text-sm text-muted-foreground tabular"><p>Per meal: ≈ {summary.mealKcal} kcal · {summary.mealProtein} g protein</p>{summary.complete ? <p>Planned meals per day: ≈ {summary.dailyKcal} kcal · {summary.dailyProtein} g protein</p> : <p>Nutrition available for {summary.known} of {summary.total} planned meals; daily totals incomplete.</p>}<p className="mt-1 text-xs">Per person · ingredient estimates where labelled · not a full-day intake target</p></div>}
      {invalid && <p role="alert" className="mb-4 border-l-2 border-tomato pl-3 text-sm">Some saved meals don't match this week's rules. Regenerate to replace them; incompatible locks won't be kept.</p>}
      {!recipes.isLoading && shortages.length > 0 && <div role="status" className="mb-4 border-l-2 border-border pl-3 text-sm text-muted-foreground">{shortages.map((x) => <p key={x.meal}>Only {x.available} {dietLabel.toLowerCase()} {MEAL_LABEL[x.meal]?.toLowerCase()} {x.available === 1 ? "recipe matches" : "recipes match"} for {x.needed} meals. {x.available ? "Matching dishes will repeat." : "These slots stay open."} Add more recipes or relax a filter.</p>)}</div>}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button size="lg" onClick={generate} disabled={!profile.data || recipes.isLoading || save.isPending} className="h-12 flex-1 rounded-lg text-base sm:flex-none sm:px-8">
          {hasAny ? <><RefreshCw className="mr-2 h-5 w-5" /> Regenerate unlocked meals</> : <><Shuffle className="mr-2 h-5 w-5" /> Fill my week</>}
        </Button>
        <Button size="lg" variant="secondary" onClick={() => setEditing(true)} className="h-12 rounded-lg">
          <SlidersHorizontal className="mr-2 h-5 w-5" /> Change this week
        </Button>
      </div>

      <div className="rounded-xl border px-5 py-6 md:px-10 md:py-10">
        <p className="text-center text-xs uppercase tracking-[0.24em] text-muted-foreground">Menu</p>
        <div className="mx-auto mt-2 mb-6 h-px w-16 bg-border" />
        {days.map((date) => {
          const d = parseISODate(date);
          const isToday = date === todayISO;
          return (
          <section key={date} className="dotted-rule py-5 last:border-0">
            <h2 className="mb-3 text-center text-2xl md:text-3xl">
              <span className={cn("px-2", isToday && "bg-highlight")}>{d.toLocaleDateString("en", { weekday: "long" })}</span>
              <span className="ml-2 font-sans text-sm text-muted-foreground tabular">{d.toLocaleDateString("en", { day: "numeric", month: "short" })}</span>
            </h2>
            <ul>
              {slots.filter((s) => s.date === date).map((slot) => {
                const r = slot.recipe_id ? byId.get(slot.recipe_id) : undefined;
                return (
                  <li key={slot.meal + (slot.recipe_id ?? "")} className="flip-in py-2.5">
                    <div className="flex items-center gap-3">
                    {r ? (
                      <Link to="/recipes/$id" params={{ id: r.id }} className="shrink-0"><RecipeImage src={r.image_url} title={r.title} compact className="h-14 w-14 rounded-lg" /></Link>
                    ) : <div className="h-14 w-14 shrink-0 rounded-lg border border-dashed" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{MEAL_LABEL[slot.meal]}</p>
                      {r ? <Link to="/recipes/$id" params={{ id: r.id }} className="line-clamp-2 font-display text-lg leading-snug">{r.title}</Link> : <p className="font-display text-lg italic text-muted-foreground">Open slot</p>}
                      {r && <p className="text-xs text-muted-foreground tabular">{r.prep_minutes + r.cook_minutes} min</p>}
                      {r && <NutritionLine recipe={r} />}
                    </div>
                    <Button size="sm" variant="ghost" title="Choose another recipe that matches this week's diet and meal" disabled={slot.cooked || save.isPending} onClick={() => setSwapping(slot)}>Swap</Button>
                    <Button size="icon" variant="ghost" title={slot.locked ? "Unlock so regeneration can replace this meal" : "Keep this meal when regenerating; diet rules still apply"} className={cn("h-8 w-8", slot.locked && "bg-highlight")} aria-label={slot.locked ? "Unlock" : "Lock"} onClick={() => setSlot(slot, { locked: !slot.locked })} disabled={!r || slot.cooked || save.isPending}>
                      {slot.locked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    </div>
                    {r && date <= todayISO && <div className="mt-2"><CookedButton week={week} slot={slot} recipe={r} /></div>}
                    <div className="mt-2 flex flex-wrap gap-2">{prep.events.filter((e) => e.mealDate === slot.date && e.meal === slot.meal).map((e) => <PrepTag key={e.id} title={e.title} due={e.due} timezone={profile.data?.timezone ?? "UTC"} />)}</div>
                  </li>
                );
              })}
            </ul>
          </section>
        ); })}
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
          else toast("That's the only match for now — add a few more recipes for variety.");
          setSwapping(null);
        }}
      />
    </div>
  );
}

function SwapDialog({ slot, recipes, diets, onClose, onPick, onSurprise }: { slot: Slot | null; recipes: Recipe[]; diets: string[]; onClose: () => void; onPick: (id: string | null) => void; onSurprise: () => void }) {
  const [q, setQ] = useState("");
  if (!slot) return null;
  const options = recipes
    .filter((r) => matchesDiet(r, diets) && matchesMeal(r, slot.meal))
    .filter((r) => r.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-hidden rounded-xl p-0 sm:max-w-lg">
        <DialogHeader className="px-5 pt-5"><DialogTitle className="font-display text-xl">Swap {(MEAL_LABEL[slot.meal] ?? "meal").toLowerCase()}</DialogTitle></DialogHeader>
        <div className="space-y-3 px-5">
          <Button onClick={onSurprise} className="w-full rounded-lg"><Shuffle className="mr-2 h-4 w-4" /> Surprise me</Button>
          <Input placeholder="Search recipes…" value={q} onChange={(e) => setQ(e.target.value)} className="rounded-xl" />
        </div>
        <div className="max-h-[45vh] space-y-2 overflow-y-auto px-5 pb-5">
          {options.map((r) => (
            <Button variant="outline" key={r.id} onClick={() => onPick(r.id)} className={cn("flex h-auto w-full justify-start gap-3 rounded-lg border p-2 text-left whitespace-normal hover:border-primary", r.id === slot.recipe_id && "border-primary bg-secondary")}>
              <RecipeImage src={r.image_url} title={r.title} compact className="h-14 w-14 shrink-0 rounded-lg" />
              <span className="flex-1 text-sm font-medium">{r.title}</span>
            </Button>
          ))}
          {options.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No matches. Add a matching recipe or change this week's filters.</p>}
          {slot.recipe_id && <Button variant="ghost" className="w-full rounded-lg text-muted-foreground" onClick={() => onPick(null)}><X className="mr-1 h-4 w-4" /> Leave this slot empty</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
