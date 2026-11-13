import { createFileRoute, Link } from "@tanstack/react-router";
import { Download } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/Doodle";
import { PrepTag } from "@/components/PrepTag";
import { usePlan, useRecipes } from "@/hooks/use-mealmap";
import { buildIcs, computeMealEvents, computePrepEvents, MEAL_LABEL, toISODate, weekStartOf } from "@/lib/mealmap";

export const Route = createFileRoute("/_authenticated/today")({
  head: () => ({ meta: [{ title: "Today — Forkcast" }, { name: "description", content: "Tonight's dinner, today's meals and the prep that's due." }] }),
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
  const week = weekStartOf(now);
  const { profile, slots } = usePlan(week);
  const recipes = useRecipes().data ?? [];
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const meals = slots.filter((s) => s.date === today && s.recipe_id && byId.has(s.recipe_id));
  const lead = [...meals].sort((a, b) => ORDER.indexOf(a.meal) - ORDER.indexOf(b.meal))[0];
  const leadRecipe = lead ? byId.get(lead.recipe_id!) : undefined;
  const rest = meals.filter((m) => m !== lead);
  const events = profile.data ? computePrepEvents(slots, recipes, profile.data) : [];
  const end = new Date(now); end.setHours(23, 59, 59);
  const start = new Date(now); start.setHours(0, 0, 0);
  const due = events.filter((e) => e.due >= start && e.due <= end);
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
          <img src={leadRecipe.image_url ?? ""} alt={leadRecipe.title} className="aspect-[4/5] w-full bg-muted object-cover sm:aspect-[16/10] md:rounded-xl" />
          <p className="mt-3 px-4 text-sm text-muted-foreground tabular md:px-0">{leadRecipe.prep_minutes + leadRecipe.cook_minutes} min · serves {leadRecipe.servings}</p>
        </Link>
      ) : (
        <EmptyState kind="bowl">
          <p>Today's a blank page. Plan the week and it'll fill itself in.</p>
          <Button asChild className="mt-4"><Link to="/plan" search={{ week: undefined }}>Plan my week</Link></Button>
        </EmptyState>
      )}

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Prep due today</h2>
        {due.length === 0 ? (
          <p className="text-muted-foreground">No prep today. Put the kettle on.</p>
        ) : (
          <ul className="space-y-3">
            {due.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <PrepTag title={e.title} due={e.due} />
                <span className="text-sm text-muted-foreground">for {e.recipeTitle}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {rest.length > 0 && (
        <section>
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Also today</h2>
          <ul>
            {rest.map((s) => { const r = byId.get(s.recipe_id!)!; return (
              <li key={s.meal} className="dotted-rule">
                <Link to="/recipes/$id" params={{ id: r.id }} className="flex items-center gap-4 py-3">
                  <img src={r.image_url ?? ""} alt="" className="h-14 w-14 rounded-lg bg-muted object-cover" />
                  <div><p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{MEAL_LABEL[s.meal]}</p><p className="font-display text-xl">{r.title}</p></div>
                </Link>
              </li>); })}
          </ul>
        </section>
      )}

      {events.length > 0 && (
        <Button variant="outline" onClick={() => downloadIcs(buildIcs([...computeMealEvents(slots, recipes, profile.data!), ...events]), `forkcast-${week}.ics`)}><Download className="mr-2 h-4 w-4" /> Add this week to my calendar</Button>
      )}
    </div>
  );
}
