import { useState } from "react";
import { Check, Minus, Plus } from "@/components/icons";
import { DIETS, START_DAYS, MEALS, MEAL_LABEL } from "@/lib/mealmap";
import type { ProfileRow } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ProfileDraft = Pick<ProfileRow, "diets" | "meals" | "days" | "servings" | "breakfast_time" | "lunch_time" | "dinner_time" | "start_day">;

function Stepper({ value, onChange, min, max, label }: { value: number; onChange: (n: number) => void; min: number; max: number; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <Button type="button" size="icon" variant="secondary" className="rounded-lg" aria-label={`Fewer ${label}`} onClick={() => onChange(Math.max(min, value - 1))}><Minus className="h-4 w-4" /></Button>
        <span className="w-6 text-center text-lg font-semibold">{value}</span>
        <Button type="button" size="icon" variant="secondary" className="rounded-lg" aria-label={`More ${label}`} onClick={() => onChange(Math.min(max, value + 1))}><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

export function ProfileForm({ initial, submitLabel, onSubmit, showTimes }: { initial: ProfileDraft; submitLabel: string; onSubmit: (d: ProfileDraft) => Promise<void> | void; showTimes?: boolean }) {
  const [d, setD] = useState<ProfileDraft>(initial);
  const [busy, setBusy] = useState(false);

  const toggleDiet = (id: string) => {
    setD((p) => {
      if (id === "balanced") return { ...p, diets: ["balanced"] };
      const rest = p.diets.filter((x) => x !== "balanced");
      return { ...p, diets: rest.includes(id) ? rest.filter((x) => x !== id) : [...rest, id] };
    });
  };
  const toggleMeal = (m: string) => setD((p) => ({ ...p, meals: p.meals.includes(m) ? p.meals.filter((x) => x !== m) : [...p.meals, m] }));
  const valid = d.diets.length > 0 && d.meals.length > 0;

  return (
    <form
      className="space-y-8"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try { await onSubmit(d); } finally { setBusy(false); }
      }}
    >
      <section>
        <h2 className="text-xl">How do you eat?</h2>
        <p className="mb-3 text-sm text-muted-foreground">Pick as many as you like.</p>
        <div className="grid grid-cols-2 gap-2">
          {DIETS.map((diet) => {
            const on = d.diets.includes(diet.id);
            return (
              <Button variant="outline" type="button" key={diet.id} onClick={() => toggleDiet(diet.id)} aria-pressed={on} title={diet.id === "low-calorie" ? "Up to 500 kcal per serving; estimates are labelled" : undefined}
                className={cn("flex h-auto items-center justify-start gap-2 rounded-lg border p-3 text-left text-sm font-medium whitespace-normal", on ? "border-primary bg-secondary text-secondary-foreground" : "bg-card hover:border-primary/40", diet.id === "balanced" && "col-span-2")}>
                <span className="flex-1">{diet.label}</span>{on && <Check className="h-4 w-4 text-primary" />}
              </Button>
            );
          })}
        </div>
      </section>
      <section>
        <h2 className="text-xl">Which meals should we plan?</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {MEALS.map((m) => {
            const on = d.meals.includes(m);
            return (
              <Button variant="outline" type="button" key={m} onClick={() => toggleMeal(m)} aria-pressed={on}
                className={cn("h-auto rounded-lg border px-5 py-2.5 text-sm font-medium", on ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>{MEAL_LABEL[m]}</Button>
            );
          })}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl">Start on</h2>
        <div className="grid grid-cols-7 gap-1">{START_DAYS.map((day, index) => <Button key={day} type="button" size="sm" variant={(d.start_day ?? 0) === index ? "default" : "outline"} aria-pressed={(d.start_day ?? 0) === index} onClick={() => setD({ ...d, start_day: index })} className="px-0">{day}</Button>)}</div>
        <h2 className="text-xl">For how many?</h2>
        <Stepper label="People" value={d.servings} onChange={(servings) => setD({ ...d, servings })} min={1} max={12} />
        <Stepper label="Days" value={d.days} onChange={(days) => setD({ ...d, days })} min={1} max={7} />
      </section>
      {showTimes && (
        <section>
          <h2 className="text-xl">Meal times</h2>
          <p className="mb-3 text-sm text-muted-foreground">We use these to time your prep reminders.</p>
          <div className="grid grid-cols-3 gap-2">
            {(["breakfast", "lunch", "dinner"] as const).map((m) => (
              <label key={m} className="space-y-1 text-sm font-medium">
                {MEAL_LABEL[m]}
                <Input type="time" value={d[`${m}_time`]} onChange={(e) => setD({ ...d, [`${m}_time`]: e.target.value })} className="rounded-xl" />
              </label>
            ))}
          </div>
        </section>
      )}
      <Button type="submit" size="lg" disabled={!valid || busy} className="h-12 w-full rounded-lg text-base">{busy ? "Saving…" : submitLabel}</Button>
    </form>
  );
}
