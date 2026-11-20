import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPlan, fetchProfile, fetchRecipes, qk, savePlan, type WeekSettings } from "@/lib/api";
import { computePrepEvents, reconcileSlots, type Slot } from "@/lib/mealmap";
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
  const settings: WeekSettings | null = plan.data?.settings ?? (p ? { diets: p.diets, servings: p.servings, days: p.days, meals: p.meals } : null);
  const slots: Slot[] = settings && plan.data ? reconcileSlots(week, settings, plan.data.slots) : [];
  return { profile, plan, settings, slots, exists: !!plan.data?.id, hasWeekSettings: !!plan.data?.settings, checked: plan.data?.checked_keys ?? [] };
}
export function useSavePlan(week: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: { slots?: Slot[]; checked_keys?: string[]; settings?: WeekSettings }) => savePlan(week, patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: qk.plan(week) });
      const prev = qc.getQueryData(qk.plan(week));
      qc.setQueryData(qk.plan(week), (old: { slots: Slot[]; checked_keys: string[]; id: string | null; settings: WeekSettings | null } | undefined) => ({
        id: old?.id ?? "pending",
        week_start: week,
        slots: patch.slots ?? old?.slots ?? [],
        checked_keys: patch.checked_keys ?? old?.checked_keys ?? [],
        settings: patch.settings ?? old?.settings ?? null,
      }));
      return { prev };
    },
    onError: (_e, _p, ctx) => { if (ctx) qc.setQueryData(qk.plan(week), ctx.prev); toast.error("Couldn't save your week. Please try again."); },
    onSettled: () => { qc.invalidateQueries({ queryKey: qk.plan(week) }); qc.invalidateQueries({ queryKey: ["prevSettings"] }); },
  });
}
