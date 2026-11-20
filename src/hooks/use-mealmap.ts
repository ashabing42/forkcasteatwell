import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPlan, fetchProfile, fetchRecipes, qk, savePlan, type PlanRow, type WeekSettings } from "@/lib/api";
import { addDays, computePrepEvents, reconcileSlots, toISODate, weekStartOf, type Slot } from "@/lib/mealmap";
import { toast } from "sonner";

export function useProfile() {
  return useQuery({ queryKey: qk.profile, queryFn: fetchProfile });
}
export function useRecipes() {
  return useQuery({ queryKey: qk.recipes, queryFn: fetchRecipes });
}
export function usePrepSchedule(week: string) {
  const { profile, plan, slots } = usePlan(week);
  const recipes = useRecipes();
  return {
    events: profile.data && recipes.data ? computePrepEvents(slots, recipes.data, profile.data) : [],
    loading: profile.isLoading || plan.isLoading || recipes.isLoading,
  };
}
export function usePlan(week: string) {
  const profile = useProfile();
  const plan = useQuery({ queryKey: qk.plan(week), queryFn: () => fetchPlan(week) });
  const p = profile.data;
  // Each week has its own answers; older weeks without them fall back to the profile defaults.
  const settings: WeekSettings | null = plan.data?.settings ?? (p ? { diets: p.diets, servings: p.servings, days: p.days, meals: p.meals, start_day: plan.data?.id ? 0 : p.start_day ?? 0 } : null);
  const slots: Slot[] = settings && plan.data ? reconcileSlots(week, settings, plan.data.slots) : [];
  return { profile, plan, settings, slots, exists: !!plan.data?.id, hasWeekSettings: !!plan.data?.settings, checked: plan.data?.checked_keys ?? [], needed: plan.data?.needed_keys ?? [] };
}
/** A Saturday-start plan may still be the active plan on Tuesday. */
export function useActivePlan() {
  const today = toISODate(new Date());
  const currentWeek = weekStartOf(new Date());
  const current = usePlan(currentWeek);
  const previousWeek = addDays(currentWeek, -7);
  const previous = usePlan(previousWeek);
  const usePrevious = !current.slots.some((s) => s.date === today && s.recipe_id) && previous.slots.some((s) => s.date === today && s.recipe_id);
  return { ...(usePrevious ? previous : current), week: usePrevious ? previousWeek : currentWeek };
}
export function useSavePlan(week: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: { slots?: Slot[]; checked_keys?: string[]; needed_keys?: string[]; settings?: WeekSettings }) => savePlan(week, patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: qk.plan(week) });
      const prev = qc.getQueryData(qk.plan(week));
      qc.setQueryData(qk.plan(week), (old: PlanRow | undefined) => ({
        id: old?.id ?? "pending",
        week_start: week,
        slots: patch.slots ?? old?.slots ?? [],
        checked_keys: patch.checked_keys ?? old?.checked_keys ?? [],
        needed_keys: patch.needed_keys ?? old?.needed_keys ?? [],
        settings: patch.settings ?? old?.settings ?? null,
      }));
      return { prev };
    },
    onError: (_e, _p, ctx) => { if (ctx) qc.setQueryData(qk.plan(week), ctx.prev); toast.error("Couldn't save your week. Please try again."); },
    onSettled: () => { qc.invalidateQueries({ queryKey: qk.plan(week) }); qc.invalidateQueries({ queryKey: ["prevSettings"] }); },
  });
}
