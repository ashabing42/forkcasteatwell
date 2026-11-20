import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Fork } from "@/components/icons";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/SiteFooter";
import { RecipeImage } from "@/components/RecipeImage";
import { SEED_RECIPES } from "@/lib/seed-recipes";
import { DIETS, buildShoppingList, formatQty, generatePlan, matchesDiet, type Recipe, type Slot } from "@/lib/mealmap";
import { cn } from "@/lib/utils";

const DESC = "Tell Forkcast what you want to eat and how often. It picks the week's recipes and writes your shopping list. 100% free.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Forkcast — healthy meals, planned for the week" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Forkcast — healthy meals, planned for the week" },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const RECIPES: Recipe[] = SEED_RECIPES.map((r, i) => ({ ...r, id: `s${i}` }) as Recipe);
const DAYS = ["Monday", "Tuesday", "Wednesday"];

function seeded(n: number) { let s = n; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }

function Sample() {
  const [diet, setDiet] = useState("balanced");
  const [people, setPeople] = useState(2);
  const [seed, setSeed] = useState(1);
  const { slots, list } = useMemo(() => {
    const empty: Slot[] = DAYS.flatMap((_, d) => (["lunch", "dinner"] as const).map((meal) => ({ date: `2026-01-0${d + 5}`, meal, recipe_id: null, locked: false })));
    const slots = generatePlan(empty, RECIPES, [diet], seeded(seed));
    return { slots, list: buildShoppingList(slots, RECIPES, people) };
  }, [diet, people, seed]);
  const byId = (id: string | null) => RECIPES.find((r) => r.id === id);
  const pool = RECIPES.filter((r) => matchesDiet(r, [diet])).length;

  return (
    <div className="rounded-xl border bg-card p-5 md:p-6">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Try it — no account needed</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {DIETS.map((d) => (
          <button key={d.id} onClick={() => setDiet(d.id)} aria-pressed={diet === d.id}
            className={cn("rounded-lg border px-3 py-1.5 text-sm", diet === d.id ? "border-primary bg-primary text-primary-foreground" : "bg-background")}>
            {d.id === "balanced" ? "Anything" : d.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 text-sm">
        <span>Cooking for</span>
        {[1, 2, 4].map((n) => (
          <button key={n} onClick={() => setPeople(n)} aria-pressed={people === n}
            className={cn("h-8 w-8 rounded-lg border tabular", people === n ? "border-primary bg-secondary font-semibold" : "bg-background")}>{n}</button>
        ))}
        <button onClick={() => setSeed((s) => s + 1)} className="ml-auto text-primary underline underline-offset-4">Shuffle</button>
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-xl">Your week</h3>
          {pool === 0 ? <p className="mt-2 text-sm text-muted-foreground">No sample recipes for that yet.</p> : DAYS.map((day, d) => (
            <div key={day} className="dotted-rule py-2">
              <p className="font-display text-lg">{day}</p>
              {slots.filter((s) => s.date.endsWith(`0${d + 5}`)).map((s) => {
                const r = byId(s.recipe_id);
                return (
                  <div key={s.meal} className="flex items-center gap-3 py-1 text-sm">
                    <span className="w-14 text-xs uppercase tracking-wider text-muted-foreground">{s.meal}</span>
                    {r && <RecipeImage src={r.image_url} title={r.title} compact className="h-9 w-9 shrink-0 rounded-md" />}
                    <span className="truncate">{r?.title ?? "—"}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-xl">Shopping list</h3>
          <ul className="mt-2 text-sm">
            {list.slice(0, 10).map((l) => (
              <li key={l.key} className="dotted-rule flex justify-between gap-3 py-1.5">
                <span className="truncate">{l.name}</span><span className="tabular text-muted-foreground">{formatQty(l.quantity, l.unit)}</span>
              </li>
            ))}
          </ul>
          {list.length > 10 && <p className="mt-2 text-xs text-muted-foreground">+ {list.length - 10} more, grouped by aisle</p>}
        </div>
      </div>
      <Button asChild size="lg" className="mt-6 h-12 w-full rounded-lg text-base"><Link to="/auth">Save your plan</Link></Button>
    </div>
  );
}

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && navigate({ to: "/today", replace: true }));
  }, [navigate]);
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <span className="flex items-center gap-2 font-display text-2xl"><Fork className="h-6 w-6" /> Forkcast</span>
        <Button asChild variant="ghost" className="rounded-lg"><Link to="/auth">Sign in</Link></Button>
      </header>

      <section className="mx-auto grid max-w-5xl items-start gap-10 px-5 pb-16 pt-6 md:grid-cols-[1fr_1.2fr]">
        <div className="md:pt-8">
          <h1 className="text-5xl leading-[1.05] md:text-7xl">Dinner, sorted. <em className="text-primary">All week.</em></h1>
          <p className="mt-4 text-lg text-muted-foreground">Take all the thinking out of planning healthy meals.</p>
          <p className="mt-6 inline-block rounded-md bg-highlight px-3 py-1 text-sm font-medium">100% free to use</p>
        </div>
        <Sample />
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-20">
        <h2 className="text-3xl md:text-4xl">How it works</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
          {[
            { t: "Tell us what you want to eat and how often", d: "Your diet, how many people, and which meals and days you cook." },
            { t: "Forkcast picks the recipes", d: "From your saved recipes or suggested ones. Swap, lock or repeat for batch cooking." },
            { t: "Shop in one run", d: "One more click and your list is ready: exact grams and millilitres, combined and grouped by aisle." },
          ].map((s, i) => (
            <li key={s.t} className="border-t pt-5">
              <span className="font-display text-3xl text-primary tabular">{i + 1}</span>
              <h3 className="mt-2 text-xl">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-20">
        <div className="border-t pt-10 text-center">
          <h2 className="text-3xl md:text-4xl">Ready to take dinner off your mind?</h2>
          <p className="mt-2 text-muted-foreground">Free, no trials, no paywalls.</p>
          <Button asChild size="lg" className="mt-6 h-12 rounded-lg px-8 text-base"><Link to="/auth">Plan your first week</Link></Button>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
