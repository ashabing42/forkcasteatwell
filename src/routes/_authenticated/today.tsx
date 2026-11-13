import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Download } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { usePlan, useRecipes } from "@/hooks/use-mealmap";
import { buildIcs, computeMealEvents, computePrepEvents, MEAL_LABEL, toISODate, weekStartOf } from "@/lib/mealmap";

export const Route = createFileRoute("/_authenticated/today")({
  head: () => ({ meta: [{ title: "Today — MealMap" }, { name: "description", content: "Today's meals and prep tasks." }] }),
  component: Today,
});

export function downloadIcs(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function Today() {
  const now = new Date();
  const today = toISODate(now);
  const week = weekStartOf(now);
  const { profile, slots } = usePlan(week);
  const recipes = useRecipes().data ?? [];
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const meals = slots.filter((s) => s.date === today && s.recipe_id);
  const events = profile.data ? computePrepEvents(slots, recipes, profile.data) : [];
  const end = new Date(now); end.setHours(23, 59, 59);
  const start = new Date(now); start.setHours(0, 0, 0);
  const due = events.filter((e) => e.due >= start && e.due <= end);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">{now.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}</p>
        <h1 className="text-3xl">Good to see you 🌿</h1>
      </div>
      <section>
        <h2 className="mb-3 text-xl">Prep for today & tonight</h2>
        {due.length === 0 ? (
          <p className="rounded-2xl border border-dashed bg-card p-5 text-sm text-muted-foreground">Nothing to prep today — enjoy the breather!</p>
        ) : (
          <ul className="space-y-2">
            {due.map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-2xl border bg-accent p-4">
                <Bell className="h-5 w-5 text-accent-foreground" />
                <div className="flex-1"><p className="font-medium">{e.title}</p><p className="text-xs text-muted-foreground">by {e.due.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })} · for {e.recipeTitle}</p></div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="mb-3 text-xl">Today's meals</h2>
        {meals.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-6 text-center">
            <p className="text-muted-foreground">No meals planned for today yet.</p>
            <Button asChild className="mt-4 rounded-full"><Link to="/plan" search={{ week: undefined }}>Plan my week</Link></Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {meals.map((s) => { const r = byId.get(s.recipe_id!); if (!r) return null; return (
              <Link key={s.meal} to="/recipes/$id" params={{ id: r.id }} className="overflow-hidden rounded-3xl border bg-card shadow-soft">
                <img src={r.image_url ?? ""} alt="" className="aspect-[16/9] w-full object-cover" />
                <div className="p-4"><p className="text-xs font-semibold uppercase text-primary">{MEAL_LABEL[s.meal]}</p><p className="font-display text-lg">{r.title}</p></div>
              </Link>); })}
          </div>
        )}
      </section>
      {events.length > 0 && (
        <Button variant="secondary" className="rounded-full" onClick={() => downloadIcs(buildIcs([...computeMealEvents(slots, recipes, profile.data!), ...events]), `mealmap-${week}.ics`)}><Download className="mr-2 h-4 w-4" /> Add reminders to my calendar</Button>
      )}
    </div>
  );
}
