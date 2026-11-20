import { createFileRoute, Link } from "@tanstack/react-router";
import { Download } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/Doodle";
import { PrepTag } from "@/components/PrepTag";
import { RecipeImage } from "@/components/RecipeImage";
import { CookedButton } from "@/components/CookedButton";
import { NutritionLine } from "@/components/NutritionLine";
import { useActivePlan, usePrepSchedule, useRecipes } from "@/hooks/use-mealmap";
import { addDays, buildIcs, computeMealEvents, prepDueOnDate, MEAL_LABEL, toISODate, weekStartOf } from "@/lib/mealmap";

export const Route = createFileRoute("/_authenticated/today")({
  head: () => ({ meta: [{ title: "Today — Forkcast" }, { name: "description", content: "Tonight's dinner, today's meals and the prep that's due." }, { property: "og:title", content: "Today — Forkcast" }, { property: "og:description", content: "Tonight's dinner, today's meals and the prep that's due." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Today,
});

export function downloadIcs(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

const ORDER = ["dinner", "lunch", "breakfast"];

function Today() {
  const now = new Date();
  const today = toISODate(now);
  const { week, profile, slots, settings } = useActivePlan();
  const prep = usePrepSchedule(week);
  const previousPrep = usePrepSchedule(addDays(week, -7));
  const nextPrep = usePrepSchedule(addDays(week, 7));
  const recipes = useRecipes().data ?? [];
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const meals = slots.filter((s) => s.date === today && s.recipe_id && byId.has(s.recipe_id));
  const lead = [...meals].sort((a, b) => ORDER.indexOf(a.meal) - ORDER.indexOf(b.meal))[0];
  const leadRecipe = lead?.recipe_id ? byId.get(lead.recipe_id) : undefined;
  const rest = meals.filter((m) => m !== lead);
  const events = prep.events;
  const due = prepDueOnDate([...previousPrep.events, ...events, ...nextPrep.events], today, profile.data?.timezone ?? "UTC");
  const leadPrep = lead ? events.filter((e) => e.mealDate === lead.date && e.meal === lead.meal && !due.some((d) => d.id === e.id)) : [];
  const leadWord = lead?.meal === "dinner" ? "Tonight" : lead ? MEAL_LABEL[lead.meal] : "Today";

  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm uppercase tracking-[0.14em] text-muted-foreground">{now.toLocaleDateString("en", { weekday: "long", day: "numeric", month: "long" })}</p>
        {leadRecipe ? (
          <h1 className="mt-3 text-4xl leading-[1.1] md:text-6xl">{leadWord}: {leadRecipe.title}</h1>
        ) : (
          <h1 className="mt-3 text-4xl leading-[1.1] md:text-6xl">Nothing on the menu yet.</h1>
        )}
      </header>

      {leadRecipe ? (
        <Link to="/recipes/$id" params={{ id: leadRecipe.id }} className="-mx-4 block md:mx-0">
          <RecipeImage src={leadRecipe.image_url} title={leadRecipe.title} className="aspect-[4/5] w-full sm:aspect-[16/10] md:rounded-xl" />
          <p className="mt-3 px-4 text-sm text-muted-foreground tabular md:px-0">{leadRecipe.prep_minutes + leadRecipe.cook_minutes} min · serves {leadRecipe.servings}</p>
        </Link>
      ) : (
        <EmptyState kind="bowl">
          <p>Today's a blank page. Plan the week and it'll fill itself in.</p>
          <Button asChild className="mt-4"><Link to="/plan" search={{ week: undefined }}>Plan my week</Link></Button>
        </EmptyState>
      )}

      {lead && leadRecipe && <div className="flex flex-wrap items-center gap-3"><CookedButton week={week} slot={lead} recipe={leadRecipe} /><NutritionLine recipe={leadRecipe} /></div>}

      <section>
        <h2 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Prep due today</h2>
         {prep.loading || nextPrep.loading ? <p className="text-muted-foreground">Checking prep…</p> : due.length === 0 ? (
           <p className="text-muted-foreground">No prep due today.</p>
        ) : (
          <ul className="space-y-3">
            {due.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                 <PrepTag title={e.title} due={e.due} timezone={profile.data?.timezone ?? "UTC"} />
                <span className="text-sm text-muted-foreground">for {e.recipeTitle}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
       {leadPrep.length > 0 && <section><h2 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Prep for {leadRecipe?.title}</h2><div className="flex flex-wrap gap-2">{leadPrep.map((e) => <PrepTag key={e.id} title={e.title} due={e.due} timezone={profile.data?.timezone ?? "UTC"} />)}</div></section>}

      {rest.length > 0 && (
        <section>
          <h2 className="mb-1 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Also today</h2>
          <ul>
            {rest.map((s) => { const r = s.recipe_id ? byId.get(s.recipe_id) : undefined; if (!r) return null; return (
              <li key={s.meal} className="dotted-rule">
                <Link to="/recipes/$id" params={{ id: r.id }} className="flex items-center gap-4 py-3">
                  <RecipeImage src={r.image_url} title={r.title} compact className="h-14 w-14 shrink-0 rounded-lg" />
                  <div><p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{MEAL_LABEL[s.meal]}</p><p className="font-display text-xl">{r.title}</p></div>
                </Link>
              </li>); })}
          </ul>
        </section>
      )}

      {events.length > 0 && profile.data && (
        <Button variant="outline" onClick={() => { if (profile.data) downloadIcs(buildIcs([...computeMealEvents(slots, recipes, profile.data, settings?.servings), ...events]), `forkcast-${week}.ics`); }}><Download className="mr-2 h-4 w-4" /> Add this week to my calendar</Button>
      )}
    </div>
  );
}
