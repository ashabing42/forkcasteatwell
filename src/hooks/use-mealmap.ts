import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPlan, fetchProfile, fetchRecipes, qk, savePlan } from "@/lib/api";
import { reconcileSlots, type Slot } from "@/lib/mealmap";

export function useProfile() {
  return useQuery({ queryKey: qk.profile, queryFn: fetchProfile });
}
export function useRecipes() {
  return useQuery({ queryKey: qk.recipes, queryFn: fetchRecipes });
}
export function usePlan(week: string) {
  const profile = useProfile();
  const plan = useQuery({ queryKey: qk.plan(week), queryFn: () => fetchPlan(week) });
  const slots: Slot[] = profile.data && plan.data ? reconcileSlots(week, profile.data, plan.data.slots) : [];
  return { profile, plan, slots, exists: !!plan.data?.id, checked: plan.data?.checked_keys ?? [] };
}
export function useSavePlan(week: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: { slots?: Slot[]; checked_keys?: string[] }) => savePlan(week, patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: qk.plan(week) });
      const prev = qc.getQueryData(qk.plan(week));
      qc.setQueryData(qk.plan(week), (old: { slots: Slot[]; checked_keys: string[]; id: string | null } | undefined) => ({
        id: old?.id ?? "pending",
        week_start: week,
        slots: patch.slots ?? old?.slots ?? [],
        checked_keys: patch.checked_keys ?? old?.checked_keys ?? [],
      }));
      return { prev };
    },
    onError: (_e, _p, ctx) => ctx && qc.setQueryData(qk.plan(week), ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.plan(week) }),
  });
}
